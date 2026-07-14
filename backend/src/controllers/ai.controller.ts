import { Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { triageComplaint } from "../services/aiTriage.service";

/**
 * POST /api/v1/ai/triage-issue
 * Body: { complaint: string, assetId?: string }
 *
 * Converts a natural-language complaint into structured issue data
 * (title, category, priority, possible causes, initial checks, recurring
 * pattern warning). The result is advisory only — the caller (public
 * reporter or staff) must review/edit before the issue is actually saved.
 * See brief 6.1 and 6.3.
 */
export const triageIssue = asyncHandler(async (req: any, res: Response) => {
  const { complaint, assetId } = req.body;

  if (!complaint || typeof complaint !== "string" || complaint.trim().length < 5) {
    return errorResponse(res, "Please describe the problem in a few words first.", 400);
  }

  let assetContext;
  if (assetId) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        name: true,
        model: true,
        manufacturer: true,
        status: true,
        category: { select: { name: true } },
        room: {
          select: {
            name: true,
            floor: { select: { name: true, building: { select: { name: true } } } },
          },
        },
        issues: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { title: true },
        },
      },
    });

    if (asset) {
      assetContext = {
        name: asset.name,
        category: asset.category?.name,
        model: asset.model || undefined,
        manufacturer: asset.manufacturer || undefined,
        condition: asset.status,
        location: [asset.room?.floor?.building?.name, asset.room?.floor?.name, asset.room?.name]
          .filter(Boolean)
          .join(" / "),
        recentIssueTitles: asset.issues.map((i) => i.title),
      };
    }
  }

  const result = await triageComplaint(complaint.trim(), assetContext);

  return successResponse(res, result, "AI triage suggestion generated");
});
