import { ValidatedRow } from "@/lib/validations/validateRows";

export interface DistributionBatch {
  batchId: number;

  rows: ValidatedRow[];

  totalWallets: number;

  totalAmount: number;

  recipients: string[]; // Added this
  amounts: string[]; // Added this
  status?: "pending" | "processing" | "success" | "failed"; // Optional status field

  txHash?: string;
  completedAt?: string;
  error?: string;
}

const DEFAULT_BATCH_SIZE = 200;

export function createBatches(
  rows: ValidatedRow[],
  batchSize: number = DEFAULT_BATCH_SIZE,
): DistributionBatch[] {
  const validRows = rows.filter((row) => row.isValid);

  const batches: DistributionBatch[] = [];

  for (let i = 0; i < validRows.length; i += batchSize) {
    const chunk = validRows.slice(i, i + batchSize);

    const recipients = chunk.map((row) => row.Wallet);
    const amounts = chunk.map((row) => row.Amount);

    const totalAmount = chunk.reduce((sum, row) => {
      return sum + Number(row.Amount);
    }, 0);

    const status = "pending"; // Default status for new batches

    batches.push({
      batchId: batches.length + 1,

      rows: chunk,

      totalWallets: chunk.length,

      totalAmount,

      recipients, // Now stored and ready
      amounts, // Now stored and ready
      status, // Status included in the batch
    });
  }

  return batches;
}
