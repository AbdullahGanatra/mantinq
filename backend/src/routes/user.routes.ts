import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
} from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), getUsers);
router.get("/profile", authenticate, getUserById);
router.get("/:id", authenticate, authorize("ORGANIZATION_ADMIN", "MAINTENANCE_MANAGER"), getUserById);
router.post("/", authenticate, authorize("ORGANIZATION_ADMIN"), createUser);
router.put("/profile", authenticate, updateProfile);
router.put("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), updateUser);
router.delete("/:id", authenticate, authorize("ORGANIZATION_ADMIN"), deleteUser);

export default router;
