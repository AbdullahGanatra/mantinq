import { Router } from "express";
import {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from "../controllers/workorder.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getWorkOrders);
router.get("/:id", authenticate, getWorkOrderById);
router.post("/", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER", "TECHNICIAN"), createWorkOrder);
router.put("/:id", authenticate, updateWorkOrder);
router.delete("/:id", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), deleteWorkOrder);

export default router;
