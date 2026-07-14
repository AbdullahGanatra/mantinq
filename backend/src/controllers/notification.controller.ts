import { Request, Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export const getNotifications = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { unreadOnly } = req.query;

  const where: any = { userId };
  if (unreadOnly === "true") where.isRead = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return successResponse(res, { notifications, unreadCount }, "Notifications fetched");
});

export const markAsRead = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  return successResponse(res, null, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return successResponse(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  await prisma.notification.deleteMany({
    where: { id, userId },
  });

  return successResponse(res, null, "Notification deleted");
});
