import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SPREADSHEET_ID = "1hbZqv7LpQQknuaKnEol6BsaDezWCVZlaaO2hRhfgCZs";
const SHEET = "Peso";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function gatewayHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!sheetsKey) throw new Error("GOOGLE_SHEETS_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };
}

// Parse "1/08/2025" (D/M/YYYY) -> "2025-08-01"
function parseSheetDate(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Format ISO yyyy-mm-dd -> D/M/YYYY
function formatSheetDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d, 10)}/${m.padStart(2, "0")}/${y}`;
}

// Parse "91,3 kg" or "91.3" -> 91.3
function parseWeight(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/kg/i, "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatWeight(n: number): string {
  return `${n.toFixed(1).replace(".", ",")} kg`;
}

export interface WeightEntry {
  date: string; // ISO yyyy-mm-dd
  weight: number; // kg
  notes: string;
}

async function fetchRows(): Promise<string[][]> {
  const res = await fetch(
    `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!A2:C2000`,
    { headers: gatewayHeaders() },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets fetch failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  return data.values ?? [];
}

export const getEntries = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await fetchRows();
  const entries: WeightEntry[] = [];
  for (const row of rows) {
    const [dateStr, weightStr, notes] = row;
    if (!dateStr || !weightStr) continue;
    const date = parseSheetDate(dateStr);
    const weight = parseWeight(weightStr);
    if (!date || weight === null) continue;
    entries.push({ date, weight, notes: notes ?? "" });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return { entries };
});

const entryInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: z.number().min(20).max(400),
  notes: z.string().max(500).optional().default(""),
  overwrite: z.boolean().optional().default(false),
});

export const saveEntry = createServerFn({ method: "POST" })
  .inputValidator(entryInput)
  .handler(async ({ data }) => {
    const rows = await fetchRows();
    // Find existing row index (1-based, +2 because A2 is row 2)
    let existingRowNum: number | null = null;
    for (let i = 0; i < rows.length; i++) {
      const [dateStr] = rows[i];
      if (!dateStr) continue;
      if (parseSheetDate(dateStr) === data.date) {
        existingRowNum = i + 2;
        break;
      }
    }

    const values = [[formatSheetDate(data.date), formatWeight(data.weight), data.notes ?? ""]];

    if (existingRowNum !== null) {
      if (!data.overwrite) {
        return { status: "duplicate" as const, existing: rows[existingRowNum - 2] };
      }
      const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!A${existingRowNum}:C${existingRowNum}?valueInputOption=USER_ENTERED`;
      const res = await fetch(url, {
        method: "PUT",
        headers: gatewayHeaders(),
        body: JSON.stringify({ values }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Sheets update failed [${res.status}]: ${body}`);
      }
      return { status: "updated" as const };
    }

    const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${SHEET}!A:C:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: "POST",
      headers: gatewayHeaders(),
      body: JSON.stringify({ values }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sheets append failed [${res.status}]: ${body}`);
    }
    return { status: "created" as const };
  });

// Back-compat alias
export const addEntry = saveEntry;
