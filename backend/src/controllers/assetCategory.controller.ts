import { Response } from "express";
import { prisma } from "../config/database";
import { successResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export const getAssetCategories = asyncHandler(async (_req: any, res: Response) => {
  const categories = await prisma.assetCategory.findMany({
    orderBy: { name: "asc" },
  });

  return successResponse(res, categories, "Asset categories fetched");
});
