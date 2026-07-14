import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { getPagination, getPaginationMeta } from "../utils/pagination";

export const getUsers = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const { search, role, status, departmentId } = req.query;

  const where: any = { organizationId: orgId };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
        department: { select: { id: true, name: true } },
        createdAt: true,
        _count: { select: { assignedWorkOrders: true, reportedIssues: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return successResponse(res, users, "Users fetched", 200, getPaginationMeta(total, page, limit));
});

export const getUserById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const user = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
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
      department: true,
      organization: { select: { id: true, name: true } },
      createdAt: true,
      _count: {
        select: {
          assignedWorkOrders: true,
          createdWorkOrders: true,
          reportedIssues: true,
          assignedIssues: true,
        },
      },
    },
  });

  if (!user) return errorResponse(res, "User not found", 404);

  return successResponse(res, user, "User fetched");
});

export const createUser = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { email, password, firstName, lastName, role, departmentId, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return errorResponse(res, "Email already registered", 409);

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role || "EMPLOYEE",
      organizationId: orgId,
      departmentId: departmentId || null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      department: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "USER_CREATED",
      entityType: "user",
      entityId: user.id,
      description: `User "${user.firstName} ${user.lastName}" created`,
      userId: req.user.id,
    },
  });

  return successResponse(res, user, "User created", 201);
});

export const updateUser = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;
  const data = req.body;

  const existing = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "User not found", 404);

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      status: true,
      department: { select: { id: true, name: true } },
      updatedAt: true,
    },
  });

  return successResponse(res, user, "User updated");
});

export const deleteUser = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "User not found", 404);

  if (existing.id === req.user.id) {
    return errorResponse(res, "Cannot delete yourself", 400);
  }

  await prisma.user.delete({ where: { id } });

  return successResponse(res, null, "User deleted");
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const { firstName, lastName, phone, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { firstName, lastName, phone, avatar },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  return successResponse(res, user, "Profile updated");
});
