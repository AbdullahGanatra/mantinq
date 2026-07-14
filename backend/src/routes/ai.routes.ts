import { Router } from "express";
import { triageIssue } from "../controllers/ai.controller";

const router = Router();

router.post("/triage-issue", triageIssue);

export default router;
