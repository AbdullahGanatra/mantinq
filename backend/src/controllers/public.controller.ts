import { Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { logAssetHistory } from "../utils/assetHistory";
import { Request } from "express";

/**
 * GET /api/v1/public/assets/:id
 *
 * The page a person lands on after scanning an asset's QR code. No login
 * required. Only safe, non-confidential fields are returned — no serial
 * numbers, purchase cost, private technician notes, internal attachments,
 * or reporter/user personal data (brief 4.4).
 */
export const getPublicAsset = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      barcode: true,
      status: true,
      category: { select: { name: true, icon: true, color: true } },
      room: {
        select: {
          name: true,
          floor: { select: { name: true, building: { select: { name: true } } } },
        },
      },
      images: { select: { url: true, isPrimary: true }, take: 3 },
      organization: { select: { name: true } },
      workOrders: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { completedAt: true },
      },
      maintenanceSchedules: {
        where: { isActive: true },
        orderBy: { nextDueDate: "asc" },
        take: 1,
        select: { nextDueDate: true },
      },
      history: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { action: true, createdAt: true },
      },
      issues: {
        where: { status: { in: ["OPEN", "IN_PROGRESS", "REOPENED"] } },
        select: { id: true },
      },
    },
  });

  // Invalid asset identifiers must show a proper not-found state (brief 4.3).
  if (!asset) return errorResponse(res, "This asset could not be found. Please check the QR code and try again.", 404);

  const safeAsset = {
    id: asset.id,
    name: asset.name,
    assetCode: asset.barcode,
    organizationName: asset.organization?.name,
    category: asset.category?.name,
    location: [asset.room?.floor?.building?.name, asset.room?.floor?.name, asset.room?.name]
      .filter(Boolean)
      .join(" / "),
    status: asset.status,
    isRetired: asset.status === "DECOMMISSIONED",
    photo: asset.images.find((i) => i.isPrimary)?.url || asset.images[0]?.url || null,
    lastServiceDate: asset.workOrders[0]?.completedAt || null,
    nextServiceDate: asset.maintenanceSchedules[0]?.nextDueDate || null,
    openIssueCount: asset.issues.length,
    recentActivity: asset.history.map((h) => ({ action: h.action, date: h.createdAt })),
  };

  return successResponse(res, safeAsset, "Asset fetched");
});

/**
 * POST /api/v1/public/assets/:id/issues
 *
 * Lets anyone who scanned the QR code report a problem, no login required
 * (brief 4.5). AI-suggested fields (from POST /api/v1/ai/triage-issue) can
 * be passed through here once the reporter has reviewed/edited them.
 */
export const reportPublicIssue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  if (!data.title || !data.description) {
    return errorResponse(res, "Please provide a title and description of the problem", 400);
  }

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return errorResponse(res, "This asset could not be found. Please check the QR code and try again.", 404);

  const count = await prisma.issue.count({ where: { organizationId: asset.organizationId } });
  const issueNumber = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || "MEDIUM",
      category: data.category,
      possibleCauses: data.possibleCauses,
      initialChecks: data.initialChecks,
      recurringWarning: data.recurringWarning,
      aiGenerated: Boolean(data.aiGenerated),
      aiEdited: Boolean(data.aiEdited),
      aiRaw: data.aiRaw,
      assetId: asset.id,
      issueNumber,
      organizationId: asset.organizationId,
      isPublicReport: true,
      reporterName: data.reporterName || "Anonymous",
      reporterEmail: data.reporterEmail || null,
      reporterPhone: data.reporterPhone || null,
    },
  });

  if (asset.status === "OPERATIONAL") {
    await prisma.asset.update({ where: { id: asset.id }, data: { status: "ISSUE_REPORTED" } });
  }

  await logAssetHistory({
    assetId: asset.id,
    action: "ISSUE_REPORTED",
    description: `Issue ${issueNumber} reported via public QR page by ${issue.reporterName}: "${issue.title}"`,
    newValue: issueNumber,
  });

  const managers = await prisma.user.findMany({
    where: { organizationId: asset.organizationId, role: { in: ["MAINTENANCE_MANAGER", "ORGANIZATION_ADMIN"] } },
  });
  for (const manager of managers) {
    await prisma.notification.create({
      data: {
        title: "New Issue Reported (QR)",
        message: `Issue ${issueNumber} reported on "${asset.name}" via public QR page`,
        type: "ISSUE_CREATED",
        userId: manager.id,
        organizationId: asset.organizationId,
        entityType: "issue",
        entityId: issue.id,
      },
    });
  }

  // Lightweight tracking code so the reporter can check status later without
  // exposing every issue's status to anyone who can guess a sequential
  // issue number.
  const trackingCode = issue.id.slice(-6).toUpperCase();

  return successResponse(
    res,
    { issueNumber: issue.issueNumber, status: issue.status, trackingCode },
    "Issue reported. Our maintenance team has been notified.",
    201
  );
});

/**
 * GET /api/v1/public/issues/:issueNumber?code=XXXXXX
 * Lets a reporter check their issue status without logging in.
 */
export const getPublicIssueStatus = asyncHandler(async (req: Request, res: Response) => {
  const { issueNumber } = req.params;
  const { code } = req.query;

  const issue = await prisma.issue.findUnique({
    where: { issueNumber },
    select: {
      id: true,
      issueNumber: true,
      title: true,
      status: true,
      priority: true,
      reportedAt: true,
      resolvedAt: true,
      asset: { select: { name: true } },
    },
  });

  if (!issue || issue.id.slice(-6).toUpperCase() !== String(code || "").toUpperCase()) {
    return errorResponse(res, "Issue not found. Check the issue number and tracking code.", 404);
  }

  const { id: _internalId, ...safeIssue } = issue;
  return successResponse(res, safeIssue, "Issue status fetched");
});
