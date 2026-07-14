import { Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, getPaginationMeta } from "../utils/pagination";
import { logAssetHistory } from "../utils/assetHistory";
import { env } from "../config/env";
import QRCode from "qrcode";

/** Builds the safe public URL that gets encoded into the QR code.
 * Per brief 4.3: "Encode only the asset's safe public URL inside the QR
 * code; never encode private notes, serial data, internal costs, or user
 * information directly." */
function buildPublicAssetUrl(assetId: string) {
  return `${env.PUBLIC_APP_URL.replace(/\/$/, "")}/scan/${assetId}`;
}

export const getAssets = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { search, status, categoryId, departmentId, roomId } = req.query;

  const where: any = { organizationId: orgId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (departmentId) where.departmentId = departmentId;
  if (roomId) where.roomId = roomId;

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        department: true,
        room: { include: { floor: { include: { building: true } } } },
        createdBy: { select: { firstName: true, lastName: true } },
        images: true,
        _count: { select: { workOrders: true, issues: true } },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return successResponse(res, assets, "Assets fetched", 200, getPaginationMeta(total, page, limit));
});

export const getAssetById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: orgId },
    include: {
      category: true,
      department: true,
      room: { include: { floor: { include: { building: true } } } },
      createdBy: { select: { firstName: true, lastName: true } },
      images: true,
      documents: true,
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      },
      issues: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { reportedBy: { select: { firstName: true, lastName: true } } },
      },
      history: { orderBy: { createdAt: "desc" }, take: 10 },
      maintenanceSchedules: { where: { isActive: true } },
    },
  });

  if (!asset) return errorResponse(res, "Asset not found", 404);

  return successResponse(res, asset, "Asset fetched");
});

export const createAsset = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const data = req.body;

  // Business rule (5.2): duplicate asset codes must be rejected with a clear message.
  if (data.barcode) {
    const dup = await prisma.asset.findUnique({ where: { barcode: data.barcode } });
    if (dup) return errorResponse(res, `Asset code "${data.barcode}" is already in use`, 409);
  }

  const asset = await prisma.asset.create({
    data: {
      ...data,
      organizationId: orgId,
      createdById: req.user.id,
    },
    include: {
      category: true,
      department: true,
      room: true,
    },
  });

  // Generate QR Code pointing at the safe public asset page (brief 4.3/4.4).
  // Editing name/location later never changes this URL, so the QR mapping
  // never breaks.
  const publicUrl = buildPublicAssetUrl(asset.id);
  const qrCodeDataUrl = await QRCode.toDataURL(publicUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#2563EB", light: "#FFFFFF" },
  });

  const updated = await prisma.asset.update({
    where: { id: asset.id },
    data: { qrCode: qrCodeDataUrl },
  });

  await logAssetHistory({
    assetId: asset.id,
    action: "ASSET_REGISTERED",
    description: `Asset "${asset.name}" registered with code ${asset.barcode || asset.id}`,
  });

  await prisma.activityLog.create({
    data: {
      action: "ASSET_CREATED",
      entityType: "asset",
      entityId: asset.id,
      description: `Asset "${asset.name}" created`,
      userId: req.user.id,
    },
  });

  return successResponse(
    res,
    { ...asset, qrCode: updated.qrCode, publicUrl },
    "Asset created",
    201
  );
});

export const updateAsset = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;
  const data = req.body;

  const existing = await prisma.asset.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Asset not found", 404);

  if (data.barcode && data.barcode !== existing.barcode) {
    const dup = await prisma.asset.findUnique({ where: { barcode: data.barcode } });
    if (dup) return errorResponse(res, `Asset code "${data.barcode}" is already in use`, 409);
  }

  const asset = await prisma.asset.update({
    where: { id },
    data,
    include: { category: true, department: true, room: true },
  });

  if (data.status && data.status !== existing.status) {
    await logAssetHistory({
      assetId: asset.id,
      action: "ASSET_STATUS_CHANGED",
      description: `Asset "${asset.name}" status changed`,
      oldValue: existing.status,
      newValue: data.status,
    });
  } else {
    await logAssetHistory({
      assetId: asset.id,
      action: "ASSET_UPDATED",
      description: `Asset "${asset.name}" details updated`,
    });
  }

  await prisma.activityLog.create({
    data: {
      action: "ASSET_UPDATED",
      entityType: "asset",
      entityId: asset.id,
      description: `Asset "${asset.name}" updated`,
      userId: req.user.id,
    },
  });

  return successResponse(res, asset, "Asset updated");
});

export const deleteAsset = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.asset.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Asset not found", 404);

  await prisma.asset.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: "ASSET_DELETED",
      entityType: "asset",
      entityId: id,
      description: `Asset "${existing.name}" deleted`,
      userId: req.user.id,
    },
  });

  return successResponse(res, null, "Asset deleted");
});

export const generateQRCode = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const asset = await prisma.asset.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, name: true, barcode: true, serialNumber: true },
  });

  if (!asset) return errorResponse(res, "Asset not found", 404);

  const publicUrl = buildPublicAssetUrl(asset.id);
  const qrCode = await QRCode.toDataURL(publicUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#2563EB", light: "#FFFFFF" },
  });

  await prisma.asset.update({ where: { id: asset.id }, data: { qrCode } });

  return successResponse(res, { qrCode, publicUrl, asset }, "QR Code generated");
});

/** Kept for internal/staff use — scanning inside the authenticated dashboard
 * (e.g. a technician scanning with the in-app scanner). Public/anonymous
 * scanning is handled by public.controller.ts instead, with no auth. */
export const scanQRCode = asyncHandler(async (req: any, res: Response) => {
  const { qrData } = req.body;
  const orgId = req.user.organizationId;

  // qrData is now the public URL (…/scan/:assetId); fall back to legacy JSON
  // payloads from QR codes generated by older versions of this app.
  let assetId: string | undefined;
  const match = typeof qrData === "string" ? qrData.match(/\/scan\/([a-zA-Z0-9-]+)/) : null;
  if (match) {
    assetId = match[1];
  } else {
    try {
      assetId = JSON.parse(qrData).assetId;
    } catch {
      return errorResponse(res, "Invalid QR code", 400);
    }
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId: orgId },
    include: {
      category: true,
      department: true,
      room: { include: { floor: { include: { building: true } } } },
      workOrders: { where: { status: { not: "COMPLETED" } }, take: 3 },
      issues: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, take: 3 },
    },
  });

  if (!asset) return errorResponse(res, "Asset not found", 404);

  return successResponse(res, asset, "Asset found");
});
