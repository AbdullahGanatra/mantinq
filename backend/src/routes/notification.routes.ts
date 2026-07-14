import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getNotifications);
router.put("/read-all", authenticate, markAllAsRead);
router.put("/:id/read", authenticate, markAsRead);
router.delete("/:id", authenticate, deleteNotification);

export default router;
