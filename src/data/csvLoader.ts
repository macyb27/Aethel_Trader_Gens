/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - CSV LOADER
 * Lädt Candles aus CSV-Dateien
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Candle } from '../types/backtest';

export interface CsvCandleOptions {
  /** Spaltennamen (default: timestamp, open, high, low, close, volume) */
  columns?: {
    timestamp?: string;
    open?: string;
    high?: string;
    low?: string;
    close?: string;
    volume?: string;
  };
  /** Trennzeichen (default: ',') */
  separator?: string;
  /** Symbol (wird jedem Candle gesetzt) */
  symbol?: string;
  /** Intervall (z.B. '1m', '1h') */
  interval?: string;
  /** Timestamp als Unix-ms oder ISO-String */
  timestampFormat?: 'unix' | 'unix_s' | 'iso';
}

const DEFAULT_COLUMNS = {
  timestamp: 'timestamp',
  open: 'open',
  high: 'high',
  low: 'low',
  close: 'close',
  volume: 'volume',
};

/**
 * Parst eine CSV-Zeile
 */
function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Lädt Candles aus CSV-String
 */
export function loadCandlesFromCsv(
  csvContent: string,
  options: CsvCandleOptions = {},
): Candle[] {
  const cols = { ...DEFAULT_COLUMNS, ...options.columns };
  const separator = options.separator ?? ',';
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0], separator);
  const candles: Candle[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], separator);
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });

    const tsRaw = row[cols.timestamp];
    let timestamp: number;
    if (options.timestampFormat === 'unix_s') {
      timestamp = parseInt(tsRaw, 10) * 1000;
    } else if (options.timestampFormat === 'iso') {
      timestamp = new Date(tsRaw).getTime();
    } else {
      timestamp = parseInt(tsRaw, 10);
    }

    const open = parseFloat(row[cols.open] ?? '0');
    const high = parseFloat(row[cols.high] ?? '0');
    const low = parseFloat(row[cols.low] ?? '0');
    const close = parseFloat(row[cols.close] ?? '0');
    const volume = parseFloat(row[cols.volume] ?? '0');

    if (isNaN(timestamp) || isNaN(close)) continue;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      symbol: options.symbol,
      interval: options.interval,
    });
  }

  return candles.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Lädt Candles aus Datei (Node.js) oder Fetch (Browser)
 */
export async function loadCandlesFromFile(
  pathOrUrl: string,
  options: CsvCandleOptions = {},
): Promise<Candle[]> {
  const isUrl = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://');

  // Node (SSR / CLI): read from filesystem
  // Vite will tree-shake this branch out of the browser build.
  if (!isUrl && import.meta.env.SSR) {
    const fs = await import('node:fs/promises');
    const content = await fs.readFile(pathOrUrl, 'utf-8');
    return loadCandlesFromCsv(content, options);
  }

  // Browser (or URL in Node): fetch content (supports absolute + relative URLs)
  if (typeof fetch !== 'undefined') {
    const res = await fetch(pathOrUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    return loadCandlesFromCsv(text, options);
  }

  throw new Error('loadCandlesFromFile requires fetch (browser) or SSR fs');
}
