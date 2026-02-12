/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - BACKTEST TYPES
 * Candle, Config und Result für Backtest-Engine
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// CANDLE
// ─────────────────────────────────────────────────────────────────────────────

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol?: string;
  interval?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKTEST CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface BacktestConfig {
  /** Startkapital */
  initialCapital: number;
  /** Symbol */
  symbol: string;
  /** Gebühren in Prozent (z.B. 0.001 = 0.1%) */
  feePercent?: number;
  /** Slippage in Prozent */
  slippagePercent?: number;
  /** Max Drawdown (Abbruch bei Überschreitung, 0 = deaktiviert) */
  maxDrawdownPercent?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKTEST RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  annualizedReturn: number;
  averageWin: number;
  averageLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  trades: BacktestTrade[];
  /** Schlusskapital */
  finalCapital: number;
  /** Equity-Kurve (optional) */
  equityCurve?: Array<{ timestamp: number; equity: number }>;
}
