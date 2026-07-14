import { Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, getPaginationMeta } from "../utils/pagination";
import { logAssetHistory } from "../utils/assetHistory";

// Allowed issue status transitions (brief 5.2 — "controlled status workflow").
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS", "RESOLVED"],
};

export const getIssues = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { search, status, priority, assetId, assignedToId } = req.query;

  const where: any = { organizationId: orgId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { issueNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assetId) where.assetId = assetId;
  if (assignedToId) where.assignedToId = assignedToId;

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { name: true, status: true } },
        reportedBy: { select: { firstName: true, lastName: true, avatar: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        workOrder: { select: { id: true, woNumber: true, status: true } },
        _count: { select: { comments: true, images: true } },
      },
    }),
    prisma.issue.count({ where }),
  ]);

  return successResponse(res, issues, "Issues fetched", 200, getPaginationMeta(total, page, limit));
});

export const getIssueById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const issue = await prisma.issue.findFirst({
    where: { id, organizationId: orgId },
    include: {
      asset: { include: { category: true, room: { include: { floor: { include: { building: true } } } } } },
      reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      workOrder: true,
      images: true,
      comments: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!issue) return errorResponse(res, "Issue not found", 404);

  return successResponse(res, issue, "Issue fetched");
});

export const createIssue = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const data = req.body;

  const asset = await prisma.asset.findFirst({ where: { id: data.assetId, organizationId: orgId } });
  if (!asset) return errorResponse(res, "Asset not found", 404);

  const count = await prisma.issue.count({ where: { organizationId: orgId } });
  const issueNumber = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  // Track whether AI suggestions were actually kept as-is or edited by the user (brief 6.3).
  const aiGenerated = Boolean(data.aiGenerated);
  const aiEdited = Boolean(data.aiEdited);

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "MEDIUM",
      category: data.category,
      possibleCauses: data.possibleCauses,
      initialChecks: data.initialChecks,
      recurringWarning: data.recurringWarning,
      aiGenerated,
      aiEdited,
      aiRaw: data.aiRaw,
      assetId: data.assetId,
      issueNumber,
      organizationId: orgId,
      reportedById: req.user.id,
    },
    include: {
      asset: { select: { name: true } },
      reportedBy: { select: { firstName: true, lastName: true } },
    },
  });

  // Sync asset status → Issue Reported (brief 5.1)
  if (asset.status === "OPERATIONAL") {
    await prisma.asset.update({ where: { id: asset.id }, data: { status: "ISSUE_REPORTED" } });
  }

  await logAssetHistory({
    assetId: asset.id,
    action: "ISSUE_REPORTED",
    description: `Issue ${issueNumber} reported by ${req.user.firstName} ${req.user.lastName}: "${issue.title}"`,
    newValue: issueNumber,
  });

  // Notify maintenance managers
  const managers = await prisma.user.findMany({
    where: { organizationId: orgId, role: { in: ["MAINTENANCE_MANAGER", "ORGANIZATION_ADMIN"] } },
  });

  for (const manager of managers) {
    await prisma.notification.create({
      data: {
        title: "New Issue Reported",
        message: `Issue ${issueNumber}: ${data.title} reported by ${req.user.firstName} ${req.user.lastName}`,
        type: "ISSUE_CREATED",
        userId: manager.id,
        organizationId: orgId,
        entityType: "issue",
        entityId: issue.id,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      action: "ISSUE_CREATED",
      entityType: "issue",
      entityId: issue.id,
      description: `Issue ${issueNumber} created`,
      userId: req.user.id,
    },
  });

  return successResponse(res, issue, "Issue created", 201);
});

export const updateIssue = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;
  const data = req.body;

  const existing = await prisma.issue.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Issue not found", 404);

  // Rule: a technician may only update an issue assigned to them.
  if (req.user.role === "TECHNICIAN" && existing.assignedToId !== req.user.id) {
    return errorResponse(res, "You can only update issues assigned to you", 403);
  }

  // Rule: a closed issue may not be edited until it is reopened.
  if (existing.status === "CLOSED" && data.status !== "REOPENED") {
    return errorResponse(res, "This issue is closed. Reopen it before making changes.", 400);
  }

  // Rule: validate the status transition against the controlled workflow.
  if (data.status && data.status !== existing.status) {
    const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(data.status)) {
      return errorResponse(
        res,
        `Cannot move issue from ${existing.status} to ${data.status}`,
        400
      );
    }

    // Rule: an issue should not be resolved without a maintenance note.
    if (data.status === "RESOLVED" && !data.resolutionNote && !existing.resolutionNote) {
      return errorResponse(res, "A maintenance/resolution note is required to resolve this issue", 400);
    }
  }

  const updateData: any = { ...data };
  if (data.status === "RESOLVED" && existing.status !== "RESOLVED") {
    updateData.resolvedAt = new Date();
  }
  if (data.status === "REOPENED") {
    updateData.resolvedAt = null;
  }

  const issue = await prisma.issue.update({
    where: { id },
    data: updateData,
    include: {
      asset: { select: { name: true, status: true } },
      reportedBy: { select: { firstName: true, lastName: true } },
    },
  });

  // Sync asset status + write history for meaningful status changes.
  if (data.status && data.status !== existing.status) {
    await logAssetHistory({
      assetId: issue.assetId,
      action: "ISSUE_STATUS_CHANGED",
      description: `Issue ${issue.issueNumber} moved from ${existing.status} to ${data.status}`,
      oldValue: existing.status,
      newValue: data.status,
    });

    if (data.status === "IN_PROGRESS" && issue.asset.status === "ISSUE_REPORTED") {
      await prisma.asset.update({ where: { id: issue.assetId }, data: { status: "UNDER_INSPECTION" } });
    }

    if (data.status === "RESOLVED") {
      await prisma.asset.update({ where: { id: issue.assetId }, data: { status: "OPERATIONAL" } });
      await logAssetHistory({
        assetId: issue.assetId,
        action: "ASSET_RETURNED_TO_SERVICE",
        description: `Asset returned to Operational after resolving issue ${issue.issueNumber}`,
      });
    }
  }

  return successResponse(res, issue, "Issue updated");
});

export const deleteIssue = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.issue.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Issue not found", 404);

  await prisma.issue.delete({ where: { id } });

  return successResponse(res, null, "Issue deleted");
});
