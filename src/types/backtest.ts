/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BACKTEST TYPES
 * Typen für Backtest-Engine und CSV-Loader
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Einzelkerze (OHLCV) */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Backtest-Konfiguration */
export interface BacktestConfig {
  symbol: string;
  startDate?: string;
  endDate?: string;
  initialCapital: number;
  feeRate?: number;
}

/** Einzelner Backtest-Trade */
export interface BacktestTradeRecord {
  entryTime: number;
  exitTime: number;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
}

/** Backtest-Ergebnis */
export interface BacktestResult {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  trades: BacktestTradeRecord[];
  equityCurve: Array<{ timestamp: number; equity: number }>;
  passed: boolean;
  passReason: string;
}
