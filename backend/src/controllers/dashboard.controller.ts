import { Request, Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const getDashboardStats = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;

  const [
    totalAssets,
    totalWorkOrders,
    totalIssues,
    totalUsers,
    openIssues,
    pendingWorkOrders,
    completedWorkOrders,
    overdueWorkOrders,
  ] = await Promise.all([
    prisma.asset.count({ where: { organizationId: orgId } }),
    prisma.workOrder.count({ where: { organizationId: orgId } }),
    prisma.issue.count({ where: { organizationId: orgId } }),
    prisma.user.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    prisma.issue.count({ where: { organizationId: orgId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.workOrder.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.workOrder.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
    prisma.workOrder.count({
      where: {
        organizationId: orgId,
        status: { not: "COMPLETED" },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  // Asset status breakdown
  const assetStatusBreakdown = await prisma.asset.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: { status: true },
  });

  // Work order status breakdown
  const workOrderStatusBreakdown = await prisma.workOrder.groupBy({
    by: ["status"],
    where: { organizationId: orgId },
    _count: { status: true },
  });

  // Monthly maintenance trend (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(subMonths(new Date(), i));
    const end = endOfMonth(subMonths(new Date(), i));
    const count = await prisma.workOrder.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: start, lte: end },
      },
    });
    months.push({ month: format(start, "MMM yyyy"), count });
  }

  // Recent activities
  const recentActivities = await prisma.activityLog.findMany({
    where: { user: { organizationId: orgId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  });

  // Upcoming maintenance
  const upcomingMaintenance = await prisma.maintenanceSchedule.findMany({
    where: {
      organizationId: orgId,
      isActive: true,
      nextDueDate: { gte: new Date() },
    },
    orderBy: { nextDueDate: "asc" },
    take: 5,
    include: { asset: { select: { name: true, status: true } } },
  });

  // Recent issues
  const recentIssues = await prisma.issue.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      asset: { select: { name: true } },
      reportedBy: { select: { firstName: true, lastName: true } },
    },
  });

  return successResponse(res, {
    stats: {
      totalAssets,
      totalWorkOrders,
      totalIssues,
      totalUsers,
      openIssues,
      pendingWorkOrders,
      completedWorkOrders,
      overdueWorkOrders,
    },
    assetStatusBreakdown,
    workOrderStatusBreakdown,
    maintenanceTrend: months,
    recentActivities,
    upcomingMaintenance,
    recentIssues,
  }, "Dashboard stats fetched");
});
