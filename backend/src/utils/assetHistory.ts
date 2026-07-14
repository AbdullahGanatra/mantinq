import { prisma } from "../config/database";

interface LogAssetHistoryInput {
  assetId: string;
  action: string;
  description?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

/**
 * Records a permanent, append-only entry in an asset's history timeline.
 *
 * Per the brief (4.8 Asset History): "Automatically record significant
 * events" and "History should not be casually editable or deletable."
 * There is intentionally no update/delete helper next to this one —
 * history rows are write-once from the server.
 */
export const logAssetHistory = async ({
  assetId,
  action,
  description,
  oldValue,
  newValue,
}: LogAssetHistoryInput) => {
  try {
    await prisma.assetHistory.create({
      data: {
        assetId,
        action,
        description,
        oldValue: oldValue ?? undefined,
        newValue: newValue ?? undefined,
      },
    });
  } catch (error) {
    // History logging must never break the primary request (asset/issue/work
    // order creation). We log to the console/winston instead of throwing.
    // eslint-disable-next-line no-console
    console.error("Failed to write asset history:", error);
  }
};
