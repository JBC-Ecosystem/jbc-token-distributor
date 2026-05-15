import { ValidatedRow } from "@/lib/validations/validateRows";

export interface DistributionBatch {
  batchId: number;

  rows: ValidatedRow[];

  totalWallets: number;

  totalAmount: number;
}

const DEFAULT_BATCH_SIZE = 200;

export function createBatches(
  rows: ValidatedRow[],
  batchSize: number = DEFAULT_BATCH_SIZE
): DistributionBatch[] {
  const validRows = rows.filter((row) => row.isValid);

  const batches: DistributionBatch[] = [];

  for (let i = 0; i < validRows.length; i += batchSize) {
    const chunk = validRows.slice(i, i + batchSize);

    const totalAmount = chunk.reduce((sum, row) => {
      return sum + Number(row.Amount);
    }, 0);

    batches.push({
      batchId: batches.length + 1,

      rows: chunk,

      totalWallets: chunk.length,

      totalAmount,
    });
  }

  return batches;
}