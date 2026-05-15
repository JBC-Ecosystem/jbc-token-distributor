import { ethers } from "ethers";
import { ParsedRow } from "@/lib/parser/parserFile";
import { prisma } from "../prisma";

const SUPPORTED_TOKENS = ["USDT", "JBC"];


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
  console.log(SUPPORTED_TOKENS_ID);
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
    if (walletSet.has(wallet)) {
      errors.push("Duplicate wallet");
      duplicates++;
    } else {
      walletSet.add(wallet);
    }

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