import { Router } from "express";
import { getPublicAsset, reportPublicIssue, getPublicIssueStatus } from "../controllers/public.controller";

const router = Router();

router.get("/assets/:id", getPublicAsset);
router.post("/assets/:id/issues", reportPublicIssue);
router.get("/issues/:issueNumber", getPublicIssueStatus);

export default router;
