import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export async function getBNBPrice() {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
  );

  const data = await response.json();

  return data.binancecoin.usd;
}

export function generateTokenId(lastId?: string | null): string {
  const prefix = "token";
  const defaultStartingId = `${prefix}1`;

  // 1. If no lastId is provided, start the sequence
  if (!lastId) {
    return defaultStartingId;
  }

  // 2. Extract digits using regex
  // This looks for all digits (\d+) in the string
  const match = lastId.match(/\d+/);

  if (match) {
    const numericPart = parseInt(match[0], 10);
    const newNumericPart = numericPart + 1;
    return `${prefix}${newNumericPart}`;
  }

  // 3. Fallback: If lastId exists but has no numbers (e.g., "token-abc")
  // restart the sequence or return the default
  return defaultStartingId;
}