import { Request, Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, getPaginationMeta } from "../utils/pagination";
import { logAssetHistory } from "../utils/assetHistory";

export const getWorkOrders = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { search, status, priority, type, assetId, assignedToId } = req.query;

  const where: any = { organizationId: orgId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { woNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (type) where.type = type;
  if (assetId) where.assetId = assetId;
  if (assignedToId) where.assignedToId = assignedToId;

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { name: true, status: true } },
        assignedTo: { select: { firstName: true, lastName: true, avatar: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        issue: { select: { id: true, title: true } },
        _count: { select: { comments: true, documents: true } },
      },
    }),
    prisma.workOrder.count({ where }),
  ]);

  return successResponse(res, workOrders, "Work orders fetched", 200, getPaginationMeta(total, page, limit));
});

export const getWorkOrderById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const workOrder = await prisma.workOrder.findFirst({
    where: { id, organizationId: orgId },
    include: {
      asset: { include: { category: true, room: { include: { floor: { include: { building: true } } } } } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      issue: true,
      comments: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: "desc" } },
      documents: true,
    },
  });

  if (!workOrder) return errorResponse(res, "Work order not found", 404);

  return successResponse(res, workOrder, "Work order fetched");
});

export const createWorkOrder = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const data = req.body;

  // Business rule (5.2): maintenance cost cannot be negative.
  if (
    (data.estimatedCost !== undefined && Number(data.estimatedCost) < 0) ||
    (data.actualCost !== undefined && Number(data.actualCost) < 0)
  ) {
    return errorResponse(res, "Cost cannot be negative", 400);
  }

  const asset = await prisma.asset.findFirst({ where: { id: data.assetId, organizationId: orgId } });
  if (!asset) return errorResponse(res, "Asset not found", 404);

  const count = await prisma.workOrder.count({ where: { organizationId: orgId } });
  const woNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const workOrder = await prisma.workOrder.create({
    data: {
      ...data,
      woNumber,
      organizationId: orgId,
      createdById: req.user.id,
    },
    include: {
      asset: { select: { name: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  // Create notification
  if (data.assignedToId) {
    await prisma.notification.create({
      data: {
        title: "New Work Order Assigned",
        message: `You have been assigned work order ${woNumber}: ${data.title}`,
        type: "WORK_ORDER_CREATED",
        userId: data.assignedToId,
        organizationId: orgId,
        entityType: "workorder",
        entityId: workOrder.id,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      action: "WORK_ORDER_CREATED",
      entityType: "workorder",
      entityId: workOrder.id,
      description: `Work order ${woNumber} created`,
      userId: req.user.id,
    },
  });

  await logAssetHistory({
    assetId: data.assetId,
    action: "WORK_ORDER_CREATED",
    description: `Work order ${woNumber} (${workOrder.title}) created`,
  });

  return successResponse(res, workOrder, "Work order created", 201);
});

export const updateWorkOrder = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;
  const data = req.body;

  // Business rule (5.2): maintenance cost cannot be negative.
  if (
    (data.estimatedCost !== undefined && Number(data.estimatedCost) < 0) ||
    (data.actualCost !== undefined && Number(data.actualCost) < 0)
  ) {
    return errorResponse(res, "Cost cannot be negative", 400);
  }

  const existing = await prisma.workOrder.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Work order not found", 404);

  const workOrder = await prisma.workOrder.update({
    where: { id },
    data,
    include: {
      asset: { select: { id: true, name: true, status: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
    },
  });

  if (data.status && data.status !== existing.status) {
    await logAssetHistory({
      assetId: workOrder.asset.id,
      action: "WORK_ORDER_STATUS_CHANGED",
      description: `Work order ${workOrder.woNumber} moved from ${existing.status} to ${data.status}`,
      oldValue: existing.status,
      newValue: data.status,
    });

    // Repair work begins → asset goes Under Maintenance (brief 5.1)
    if (data.status === "IN_PROGRESS") {
      await prisma.asset.update({ where: { id: workOrder.asset.id }, data: { status: "UNDER_MAINTENANCE" } });
      if (!workOrder.startedAt) {
        await prisma.workOrder.update({ where: { id }, data: { startedAt: new Date() } });
      }
    }
  }

  if (data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await prisma.workOrder.update({
      where: { id },
      data: { completedAt: new Date() },
    });

    // Maintenance successfully completed → asset back to Operational (brief 5.1)
    await prisma.asset.update({ where: { id: workOrder.asset.id }, data: { status: "OPERATIONAL" } });

    await logAssetHistory({
      assetId: workOrder.asset.id,
      action: "MAINTENANCE_COMPLETED",
      description: `Work order ${workOrder.woNumber} completed${data.actualCost !== undefined ? ` (cost: ${data.actualCost})` : ""}`,
    });

    await prisma.notification.create({
      data: {
        title: "Work Order Completed",
        message: `Work order ${workOrder.woNumber} has been completed`,
        type: "WORK_ORDER_COMPLETED",
        userId: workOrder.createdById,
        organizationId: orgId,
        entityType: "workorder",
        entityId: workOrder.id,
      },
    });
  }

  return successResponse(res, workOrder, "Work order updated");
});

export const deleteWorkOrder = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.workOrder.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Work order not found", 404);

  await prisma.workOrder.delete({ where: { id } });

  return successResponse(res, null, "Work order deleted");
});
