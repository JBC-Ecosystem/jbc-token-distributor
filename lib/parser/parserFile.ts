import Papa from "papaparse";
import ExcelJS from "exceljs";

export interface ParsedRow {
  Wallet: string;
  TokenId: string;
  Amount: string;
}

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseCSV(file);
  }

  if (extension === "xlsx" || extension === "xls") {
    return parseExcel(file);
  }

  throw new Error("Unsupported file type");
}

function parseCSV(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results: any) => {
        resolve(results.data as ParsedRow[]);
      },

      error: (error: any) => {
        reject(error);
      },
    });
  });
}

async function parseExcel(file: File): Promise<ParsedRow[]> {
  const workbook = new ExcelJS.Workbook();

  const arrayBuffer = await file.arrayBuffer();

  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];

  const rows: ParsedRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    rows.push({
      Wallet: String(row.getCell(1).value ?? ""),
      TokenId: String(row.getCell(2).value ?? ""),
      Amount: String(row.getCell(3).value ?? ""),
    });
  });

  return rows;
}