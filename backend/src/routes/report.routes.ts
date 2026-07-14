import { Router } from "express";
import {
  getMaintenanceCostReport,
  getTechnicianPerformance,
  getAssetUtilization,
  getIssueResolutionReport,
} from "../controllers/report.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/maintenance-cost", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), getMaintenanceCostReport);
router.get("/technician-performance", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), getTechnicianPerformance);
router.get("/asset-utilization", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), getAssetUtilization);
router.get("/issue-resolution", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), getIssueResolutionReport);

export default router;
