import { Request, Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export const getDepartments = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;

  const departments = await prisma.department.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, assets: true } },
    },
  });

  return successResponse(res, departments, "Departments fetched");
});

export const createDepartment = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { name, description, color } = req.body;

  const department = await prisma.department.create({
    data: { name, description, color, organizationId: orgId },
  });

  return successResponse(res, department, "Department created", 201);
});

export const updateDepartment = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Department not found", 404);

  const department = await prisma.department.update({
    where: { id },
    data: req.body,
  });

  return successResponse(res, department, "Department updated");
});

export const deleteDepartment = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.department.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Department not found", 404);

  await prisma.department.delete({ where: { id } });

  return successResponse(res, null, "Department deleted");
});
