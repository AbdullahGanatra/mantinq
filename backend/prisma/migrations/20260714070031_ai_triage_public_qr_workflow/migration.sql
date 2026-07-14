-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetStatus" ADD VALUE 'ISSUE_REPORTED';
ALTER TYPE "AssetStatus" ADD VALUE 'UNDER_INSPECTION';

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_reportedById_fkey";

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "aiEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiRaw" JSONB,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "initialChecks" TEXT,
ADD COLUMN     "isPublicReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "possibleCauses" TEXT,
ADD COLUMN     "recurringWarning" TEXT,
ADD COLUMN     "reporterEmail" TEXT,
ADD COLUMN     "reporterName" TEXT,
ADD COLUMN     "reporterPhone" TEXT,
ADD COLUMN     "resolutionNote" TEXT,
ALTER COLUMN "reportedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
