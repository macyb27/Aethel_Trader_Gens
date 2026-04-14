/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - CSV LOADER
 * Lädt Candles aus CSV-Dateien für Backtests
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Candle } from '../types/backtest';

export interface CsvColumnMapping {
  timestamp?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

const DEFAULT_COLUMNS: Required<CsvColumnMapping> = {
  timestamp: 'timestamp',
  open: 'open',
  high: 'high',
  low: 'low',
  close: 'close',
  volume: 'volume',
};

/**
 * Parst eine CSV-Zeile (unterstützt Komma und Semikolon)
 */
function parseCsvLine(line: string): string[] {
  const delimiter = line.includes(';') ? ';' : ',';
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && c === delimiter) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Lädt Candles aus CSV-Text
 * Erwartet Header-Zeile mit Spaltennamen (timestamp, open, high, low, close, volume)
 * oder custom mapping
 */
export function loadCandlesFromCsv(
  csvText: string,
  mapping: CsvColumnMapping = {}
): Candle[] {
  const cols = { ...DEFAULT_COLUMNS, ...mapping };
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const headerLower = header.map((h) => h.toLowerCase().trim());

  const idx = (name: string): number => {
    const key = (cols as Record<string, string>)[name];
    if (!key) return -1;
    const i = headerLower.indexOf(key.toLowerCase());
    if (i >= 0) return i;
    return headerLower.indexOf(name);
  };

  const tsIdx = idx('timestamp');
  const oIdx = idx('open');
  const hIdx = idx('high');
  const lIdx = idx('low');
  const cIdx = idx('close');
  const vIdx = idx('volume');

  if (oIdx < 0 || hIdx < 0 || lIdx < 0 || cIdx < 0) {
    throw new Error('CSV must have open, high, low, close columns');
  }

  const candles: Candle[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const toNum = (arr: string[], index: number): number =>
      index >= 0 && arr[index] ? parseFloat(String(arr[index]).replace(/,/g, '.')) : 0;

    let ts: number;
    if (tsIdx >= 0 && row[tsIdx]) {
      const raw = row[tsIdx];
      if (/^\d{13}$/.test(raw)) {
        ts = parseInt(raw, 10);
      } else {
        ts = new Date(raw).getTime();
      }
    } else {
      ts = i;
    }

    candles.push({
      timestamp: ts,
      open: toNum(row, oIdx),
      high: toNum(row, hIdx),
      low: toNum(row, lIdx),
      close: toNum(row, cIdx),
      volume: vIdx >= 0 ? toNum(row, vIdx) : 0,
    });
  }

  return candles.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Lädt Candles aus einer URL (z.B. GitHub Raw)
 */
export async function loadCandlesFromUrl(
  url: string,
  mapping?: CsvColumnMapping
): Promise<Candle[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  const text = await res.text();
  return loadCandlesFromCsv(text, mapping);
}
