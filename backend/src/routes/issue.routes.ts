import { Router } from "express";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
} from "../controllers/issue.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getIssues);
router.get("/:id", authenticate, getIssueById);
router.post("/", authenticate, createIssue);
router.put("/:id", authenticate, updateIssue);
router.delete("/:id", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), deleteIssue);

export default router;
