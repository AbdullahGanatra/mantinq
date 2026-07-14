import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/department.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getDepartments);
router.post("/", authenticate, authorize("ORGANIZATION_ADMIN"), createDepartment);
router.put("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), updateDepartment);
router.delete("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), deleteDepartment);

export default router;
