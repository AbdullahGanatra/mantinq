import { Router } from "express";
import { getAssetCategories } from "../controllers/assetCategory.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAssetCategories);

export default router;
