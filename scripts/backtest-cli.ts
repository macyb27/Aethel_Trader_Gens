#!/usr/bin/env npx tsx
/**
 * ÆTHER-TRADER Ω v4.0 - BACKTEST CLI
 * Usage: npx tsx scripts/backtest-cli.ts [path/to/candles.csv]
 */

import { loadCandlesFromCsv, loadCandlesFromFile } from '../src/data/csvLoader';
import { BacktestEngine } from '../src/logic/backtestEngine';
import type { Candle } from '../src/types/backtest';
import type { OrderIntent } from '../src/types/trading';
import type { BacktestContext } from '../src/logic/backtestEngine';

// Demo-Strategie: Einfacher SMA-Crossover (SMA20/SMA50)
function demoDecide(candle: Candle, context: BacktestContext): OrderIntent[] {
  const { candles, index, position } = context;
  if (index < 50) return [];

  const slice = candles.slice(Math.max(0, index - 50), index + 1);
  const closes = slice.map((c) => c.close);
  const sma20 = closes.length >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : closes[closes.length - 1];
  const sma50 = closes.length >= 50 ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 : closes[closes.length - 1];

  const id = `intent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!position) {
    if (sma20 > sma50) {
      const quantity = (context.balance * 0.05) / candle.close;
      return [{
        id,
        symbol: candle.symbol ?? 'BTCUSDT',
        side: 'buy',
        orderType: 'market',
        quantity,
        source: 'demo-sma',
        timestamp: candle.timestamp,
      }];
    }
  } else {
    if (position.side === 'long' && sma20 < sma50) {
      return [{
        id,
        symbol: candle.symbol ?? 'BTCUSDT',
        side: 'sell',
        orderType: 'market',
        quantity: 0,
        source: 'demo-sma',
        timestamp: candle.timestamp,
        closePosition: true,
      }];
    }
  }

  return [];
}

// Demo-CSV: ~60 Tage für SMA50
function generateDemoCsv(): string {
  const rows = ['timestamp,open,high,low,close,volume'];
  let price = 42000;
  const start = Date.UTC(2024, 0, 1);
  for (let i = 0; i < 60; i++) {
    const change = (Math.random() - 0.48) * 500;
    price = Math.max(35000, Math.min(50000, price + change));
    const ts = start + i * 86400000;
    rows.push(`${ts},${price - 100},${price + 200},${price - 200},${price},${1000 + Math.floor(Math.random() * 500)}`);
  }
  return rows.join('\n');
}

async function main() {
  const csvPath = process.argv[2];

  let candles: Candle[];
  if (csvPath) {
    try {
      candles = await loadCandlesFromFile(csvPath, {
        symbol: 'BTCUSDT',
        interval: '1d',
        timestampFormat: 'unix',
      });
    } catch (e) {
      const { readFile } = await import('fs/promises');
      const content = await readFile(csvPath, 'utf-8');
      candles = loadCandlesFromCsv(content, {
        symbol: 'BTCUSDT',
        interval: '1d',
        timestampFormat: 'unix',
      });
    }
  } else {
    candles = loadCandlesFromCsv(generateDemoCsv(), {
      symbol: 'BTCUSDT',
      interval: '1d',
      timestampFormat: 'unix',
    });
  }

  console.log(`Loaded ${candles.length} candles`);

  const engine = new BacktestEngine();
  const result = await engine.run(candles, demoDecide, {
    initialCapital: 10000,
    symbol: 'BTCUSDT',
  });

  console.log('\n=== Backtest Results ===');
  console.log(`Total Trades: ${result.totalTrades}`);
  console.log(`Win Rate: ${(result.winRate * 100).toFixed(1)}%`);
  console.log(`Profit Factor: ${result.profitFactor.toFixed(2)}`);
  console.log(`Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}`);
  console.log(`Max Drawdown: ${(result.maxDrawdown * 100).toFixed(1)}%`);
  console.log(`Total Return: ${(result.totalReturn * 100).toFixed(1)}%`);
  console.log(`Final Capital: $${result.finalCapital.toFixed(2)}`);
}

main().catch(console.error);
