import { ethers } from "ethers";
import { ParsedRow } from "@/lib/parser/parserFile";



export interface ValidatedRow extends ParsedRow {
  isValid: boolean;
  errors: string[];
}

export interface ValidationSummary {
  validRows: ValidatedRow[];
  invalidRows: ValidatedRow[];

  totalWallets: number;
  totalValid: number;
  totalInvalid: number;

  duplicates: number;
}


export function validateRows(
  rows: ParsedRow[],
  SUPPORTED_TOKENS_ID: string
): ValidationSummary {
  const walletSet = new Set<string>();

  const validatedRows: ValidatedRow[] = [];

  let duplicates = 0;

  for (const row of rows) {
    const errors: string[] = [];

    const wallet = row.Wallet?.trim();
    const token = row.TokenId?.trim();
    const amount = row.Amount?.trim();

    // Wallet validation
    if (!wallet || !ethers.isAddress(wallet)) {
      errors.push("Invalid wallet address");
    }

    // Duplicate detection
    // if (walletSet.has(wallet)) {
    //   errors.push("Duplicate wallet");
    //   duplicates++;
    // } else {
    //   walletSet.add(wallet);
    // }

    // Token validation
    if (!SUPPORTED_TOKENS_ID.includes(token)) {
      errors.push("Unsupported token");
    }

    // Amount validation
    const numericAmount = Number(amount);

    if (!amount || isNaN(numericAmount)) {
      errors.push("Invalid amount");
    }

    if (numericAmount <= 0) {
      errors.push("Amount must be greater than zero");
    }

    validatedRows.push({
      ...row,
      TokenId: token,
      Amount:  amount,
      isValid: errors.length === 0,
      errors,
    });
  }

  const validRows = validatedRows.filter((r) => r.isValid);

  const invalidRows = validatedRows.filter((r) => !r.isValid);



  return {
    validRows,
    invalidRows,

    totalWallets: rows.length,
    totalValid: validRows.length,
    totalInvalid: invalidRows.length,

    duplicates,
  };
}

export function exportDuplicateWalletRows(validation: ValidationSummary) {
  const duplicateRows =
    validation?.invalidRows?.filter((row: any) =>
      row.errors?.includes("Duplicate wallet"),
    ) || [];

  if (duplicateRows.length === 0) {
    alert("No duplicate wallet address rows found.");
    return;
  }

  const headers = ["Wallet", "TokenId", "Amount"];

  const csvRows = duplicateRows.map((row: any) => [
    row.Wallet,
    row.TokenId,
    row.Amount,
  ]);

  const csvContent = [
    headers.join(","),
    ...csvRows.map((row: any) =>
      row
        .map((value: any) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "duplicate-wallet-addresses.csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}