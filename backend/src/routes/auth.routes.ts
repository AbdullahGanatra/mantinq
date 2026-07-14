import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  getMe,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("organizationName").trim().notEmpty(),
    validate,
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    validate,
  ],
  login
);

router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", [body("email").isEmail(), validate], forgotPassword);
router.get("/me", authenticate, getMe);

export default router;
