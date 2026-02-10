/**
 * ÆTHER-TRADER Ω v4.0 - Backtest CLI
 * Lädt CSV, führt Backtest aus, gibt Kennzahlen aus
 *
 * Nutzung: npx tsx scripts/backtest-cli.ts <csv-path>
 */

import { loadCandlesFromCsv } from '../src/data/csvLoader';
import { runBacktest } from '../src/logic/backtestEngine';
import { createBacktestAdapter } from '../src/agents/backtestAgentAdapter';
import { BaseAgent } from '../src/agents/baseAgent';
import type { Candle } from '../src/types/backtest';
import type { OrderIntent } from '../src/types/trading';
import * as fs from 'fs';

// Beispiel-Agent: Einfache SMA-Crossover-Strategie
class SimpleSmaAgent extends BaseAgent {
  readonly id = 'sma-agent';
  readonly name = 'Simple SMA Crossover';

  decide(candle: Candle, context: { index: number; candles: Candle[] }): OrderIntent[] {
    const { index, candles } = context;
    if (index < 50) return [];

    const slice = candles.slice(Math.max(0, index - 50), index + 1);
    const sma20 = this.sma(slice.map((c) => c.close), 20);
    const sma50 = this.sma(slice.map((c) => c.close), 50);
    if (sma20 === null || sma50 === null) return [];

    const prevSlice = candles.slice(Math.max(0, index - 51), index);
    const prevSma20 = prevSlice.length >= 20 ? this.sma(prevSlice.map((c) => c.close), 20) : null;
    const prevSma50 = prevSlice.length >= 50 ? this.sma(prevSlice.map((c) => c.close), 50) : null;

    if (prevSma20 === null || prevSma50 === null) return [];

    const crossUp = prevSma20 <= prevSma50 && sma20 > sma50;
    const crossDown = prevSma20 >= prevSma50 && sma20 < sma50;

    const qty = (10000 * 0.1) / candle.close;

    if (crossUp) return [{ symbol: 'BTCUSDT', side: 'buy', type: 'market', quantity: qty }];
    if (crossDown) return [{ symbol: 'BTCUSDT', side: 'sell', type: 'market', quantity: qty, reduceOnly: true }];
    return [];
  }

  private sma(arr: number[], period: number): number | null {
    if (arr.length < period) return null;
    const slice = arr.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }
}

async function main() {
  const csvPath = process.argv[2] || 'data/btcusdt-1h.csv';
  if (!fs.existsSync(csvPath)) {
    console.error('CSV-Datei nicht gefunden:', csvPath);
    console.log('Beispiel: npx tsx scripts/backtest-cli.ts data/btcusdt-1h.csv');
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const candles = loadCandlesFromCsv(csvText);
  console.log(`Geladen: ${candles.length} Candles`);

  const agent = new SimpleSmaAgent();
  const adapter = createBacktestAdapter(agent);
  const result = runBacktest(candles, adapter, {
    symbol: 'BTCUSDT',
    initialCapital: 10000,
    feeRate: 0.001,
  });

  console.log('\n=== Backtest-Ergebnis ===');
  console.log('Symbol:', result.symbol);
  console.log('Periode:', result.startDate, '-', result.endDate);
  console.log('Initial:', result.initialCapital, '→ Final:', result.finalCapital.toFixed(2));
  console.log('Return:', result.totalReturnPercent.toFixed(2), '%');
  console.log('Sharpe:', result.sharpeRatio.toFixed(2));
  console.log('Max Drawdown:', result.maxDrawdownPercent.toFixed(1), '%');
  console.log('Win Rate:', (result.winRate * 100).toFixed(1), '%');
  console.log('Trades:', result.totalTrades);
  console.log('Passed:', result.passed);
  console.log('Reason:', result.passReason);
}

main().catch(console.error);
