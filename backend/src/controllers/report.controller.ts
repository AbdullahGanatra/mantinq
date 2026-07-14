import { Request, Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export const getMaintenanceCostReport = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { months = 6 } = req.query;

  const data = [];
  for (let i = parseInt(months) - 1; i >= 0; i--) {
    const start = startOfMonth(subMonths(new Date(), i));
    const end = endOfMonth(subMonths(new Date(), i));

    const workOrders = await prisma.workOrder.findMany({
      where: {
        organizationId: orgId,
        completedAt: { gte: start, lte: end },
        status: "COMPLETED",
      },
      select: { actualCost: true, estimatedCost: true },
    });

    const totalCost = workOrders.reduce((sum, wo) => sum + Number(wo.actualCost || 0), 0);
    const estimatedCost = workOrders.reduce((sum, wo) => sum + Number(wo.estimatedCost || 0), 0);

    data.push({
      month: start.toLocaleString("default", { month: "short", year: "numeric" }),
      totalCost,
      estimatedCost,
      count: workOrders.length,
    });
  }

  return successResponse(res, data, "Maintenance cost report fetched");
});

export const getTechnicianPerformance = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;

  const technicians = await prisma.user.findMany({
    where: { organizationId: orgId, role: "TECHNICIAN" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      assignedWorkOrders: {
        where: { status: "COMPLETED" },
        select: { actualHours: true, actualCost: true, completedAt: true },
      },
    },
  });

  const performance = technicians.map((tech) => ({
    id: tech.id,
    name: `${tech.firstName} ${tech.lastName}`,
    avatar: tech.avatar,
    completedWorkOrders: tech.assignedWorkOrders.length,
    totalHours: tech.assignedWorkOrders.reduce((sum, wo) => sum + (wo.actualHours || 0), 0),
    totalCost: tech.assignedWorkOrders.reduce((sum, wo) => sum + Number(wo.actualCost || 0), 0),
  }));

  return successResponse(res, performance, "Technician performance fetched");
});

export const getAssetUtilization = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;

  const assets = await prisma.asset.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { workOrders: true, issues: true } },
      workOrders: {
        where: { status: "COMPLETED" },
        select: { actualHours: true, completedAt: true },
      },
    },
  });

  const utilization = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    status: asset.status,
    totalWorkOrders: asset._count.workOrders,
    totalIssues: asset._count.issues,
    totalDowntime: asset.workOrders.reduce((sum, wo) => sum + (wo.actualHours || 0), 0),
  }));

  return successResponse(res, utilization, "Asset utilization fetched");
});

export const getIssueResolutionReport = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;

  const [totalIssues, resolvedIssues, avgResolutionTime] = await Promise.all([
    prisma.issue.count({ where: { organizationId: orgId } }),
    prisma.issue.count({ where: { organizationId: orgId, status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.issue.findMany({
      where: { organizationId: orgId, resolvedAt: { not: null } },
      select: { reportedAt: true, resolvedAt: true },
    }),
  ]);

  const avgTime = avgResolutionTime.length > 0
    ? avgResolutionTime.reduce((sum, issue) => {
        const diff = new Date(issue.resolvedAt!).getTime() - new Date(issue.reportedAt).getTime();
        return sum + diff;
      }, 0) / avgResolutionTime.length / (1000 * 60 * 60) // hours
    : 0;

  const byPriority = await prisma.issue.groupBy({
    by: ["priority"],
    where: { organizationId: orgId },
    _count: { priority: true },
  });

  return successResponse(res, {
    totalIssues,
    resolvedIssues,
    resolutionRate: totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0,
    avgResolutionTime: Math.round(avgTime * 100) / 100,
    byPriority,
  }, "Issue resolution report fetched");
});
