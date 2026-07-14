import { Router } from "express";
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  generateQRCode,
  scanQRCode,
} from "../controllers/asset.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAssets);
router.get("/:id", authenticate, getAssetById);
router.post("/", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), createAsset);
router.put("/:id", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), updateAsset);
router.delete("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), deleteAsset);
router.get("/:id/qr", authenticate, generateQRCode);
router.post("/scan", authenticate, scanQRCode);

export default router;
