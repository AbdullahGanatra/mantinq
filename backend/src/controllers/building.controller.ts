import { Request, Response } from "express";
import { prisma } from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export const getBuildings = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;

  const buildings = await prisma.building.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    include: {
      floors: {
        orderBy: { number: "asc" },
        include: {
          rooms: { orderBy: { name: "asc" } },
        },
      },
      _count: { select: { floors: true } },
    },
  });

  return successResponse(res, buildings, "Buildings fetched");
});

export const createBuilding = asyncHandler(async (req: any, res: Response) => {
  const orgId = req.user.organizationId;
  const { name, description, address, floors } = req.body;

  const building = await prisma.building.create({
    data: {
      name,
      description,
      address,
      organizationId: orgId,
      floors: {
        create: floors?.map((f: any) => ({
          name: f.name,
          number: f.number,
          rooms: {
            create: f.rooms?.map((r: any) => ({
              name: r.name,
              number: r.number,
              description: r.description,
            })) || [],
          },
        })) || [],
      },
    },
    include: { floors: { include: { rooms: true } } },
  });

  return successResponse(res, building, "Building created", 201);
});

export const updateBuilding = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.building.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Building not found", 404);

  const building = await prisma.building.update({
    where: { id },
    data: req.body,
  });

  return successResponse(res, building, "Building updated");
});

export const deleteBuilding = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const orgId = req.user.organizationId;

  const existing = await prisma.building.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return errorResponse(res, "Building not found", 404);

  await prisma.building.delete({ where: { id } });

  return successResponse(res, null, "Building deleted");
});
