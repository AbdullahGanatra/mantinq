import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/generateTokens";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { sendEmail } from "../config/email";
import crypto from "crypto";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, organizationName, phone } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return errorResponse(res, "Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: organizationName.toLowerCase().replace(/\s+/g, "-"),
      email,
      phone,
    },
  });

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: "ORGANIZATION_ADMIN",
      organizationId: organization.id,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      organizationId: true,
      createdAt: true,
    },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  await sendEmail(
    email,
    "Welcome to MaintainIQ",
    `<h1>Welcome ${firstName}!</h1><p>Your organization ${organizationName} has been created.</p>`
  );

  return successResponse(res, { user, accessToken, refreshToken }, "Registration successful", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return errorResponse(res, "Invalid credentials", 401);
  }

  if (user.status !== "ACTIVE") {
    return errorResponse(res, "Account is not active", 403);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);

  const { password: _, ...userWithoutPassword } = user;

  return successResponse(res, { user: userWithoutPassword, accessToken, refreshToken }, "Login successful");
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return errorResponse(res, "Refresh token required", 401);
  }

  const decoded = verifyRefreshToken(token);
  const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    return errorResponse(res, "Invalid or expired refresh token", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    return errorResponse(res, "User not found", 401);
  }

  const accessToken = generateAccessToken(user.id, user.role);

  return successResponse(res, { accessToken }, "Token refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  return successResponse(res, null, "Logged out successfully");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return successResponse(res, null, "If email exists, reset link sent");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      // Store in a separate table in production
      // For now, we'll use a simple approach
    },
  });

  await sendEmail(
    email,
    "Password Reset - MaintainIQ",
    `<h1>Password Reset</h1><p>Click <a href="http://localhost:5173/reset-password?token=${resetToken}">here</a> to reset.</p>`
  );

  return successResponse(res, null, "If email exists, reset link sent");
});

export const getMe = asyncHandler(async (req: any, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      organization: true,
      department: true,
      createdAt: true,
    },
  });

  return successResponse(res, user, "User profile fetched");
});
