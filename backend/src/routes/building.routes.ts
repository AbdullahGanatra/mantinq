import { Router } from "express";
import {
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from "../controllers/building.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getBuildings);
router.post("/", authenticate, authorize("ORGANIZATION_ADMIN"), createBuilding);
router.put("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), updateBuilding);
router.delete("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), deleteBuilding);

export default router;
