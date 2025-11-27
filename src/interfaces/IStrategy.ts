/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - STRATEGY INTERFACE
 * Core interface definitions for trading strategy implementation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NormalizedKline, NormalizedTrade } from '../logic/crdt_store';

// ─────────────────────────────────────────────────────────────────────────────
// CORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SignalType = 'LONG' | 'SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT' | 'NEUTRAL';

export interface Signal {
  type: SignalType;
  symbol: string;
  strength: number;      // 0.0 to 1.0
  confidence: number;    // 0.0 to 1.0
  source: string;        // Which feature generated this signal
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface StrategyParameters {
  // Risk Management
  maxPositionSize: number;      // Max % of portfolio per position
  maxDrawdown: number;          // Max allowed drawdown before stopping
  stopLossPercent: number;      // Default stop loss %
  takeProfitPercent: number;    // Default take profit %
  
  // Entry/Exit
  entryThreshold: number;       // Min signal strength to enter
  exitThreshold: number;        // Min signal strength to exit
  
  // Position Management
  pyramidingEnabled: boolean;   // Allow adding to positions
  maxPyramidLevels: number;     // Max number of adds
  
  // Time Constraints
  minHoldTime: number;          // Min time in position (ms)
  maxHoldTime: number;          // Max time in position (ms)
  
  // Custom Parameters
  custom: Record<string, number | string | boolean>;
}

export interface StrategyState {
  isActive: boolean;
  currentSignal: Signal | null;
  lastSignalTime: number;
  totalSignals: number;
  winningSignals: number;
  losingSignals: number;
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
}

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

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core Strategy Interface
 * All strategies must implement this interface to be compatible with ÆTHER-TRADER
 */
export interface IStrategy {
  /** Unique identifier for this strategy */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Strategy version */
  readonly version: string;
  
  /** Description of strategy logic */
  readonly description: string;
  
  /** Strategy parameters */
  parameters: StrategyParameters;
  
  /** Current state */
  state: StrategyState;
  
  /**
   * Initialize the strategy
   * Called once when the strategy is loaded
   */
  initialize(): Promise<void>;
  
  /**
   * Process a new market tick (trade)
   * @param trade The normalized trade data
   * @returns Signal if any, null otherwise
   */
  evaluateTick(trade: NormalizedTrade): Signal | null;
  
  /**
   * Process a completed candle
   * @param kline The normalized kline data
   * @returns Signal if any, null otherwise
   */
  evaluateKline(kline: NormalizedKline): Signal | null;
  
  /**
   * Process multiple klines at once (for indicators)
   * @param klines Array of historical klines
   * @returns Signal if any, null otherwise
   */
  evaluateKlines(klines: NormalizedKline[]): Signal | null;
  
  /**
   * Update strategy parameters
   * @param params Partial parameter updates
   */
  updateParameters(params: Partial<StrategyParameters>): void;
  
  /**
   * Run backtest on historical data
   * @param klines Historical kline data
   * @param startBalance Starting balance for backtest
   * @returns Backtest results
   */
  backtest(klines: NormalizedKline[], startBalance: number): BacktestResult;
  
  /**
   * Reset strategy state
   */
  reset(): void;
  
  /**
   * Cleanup resources
   */
  dispose(): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ABSTRACT BASE STRATEGY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Abstract base class providing common strategy functionality
 */
export abstract class BaseStrategy implements IStrategy {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description: string;
  
  parameters: StrategyParameters;
  state: StrategyState;
  
  constructor(params?: Partial<StrategyParameters>) {
    this.parameters = {
      maxPositionSize: 0.1,
      maxDrawdown: 0.2,
      stopLossPercent: 0.02,
      takeProfitPercent: 0.04,
      entryThreshold: 0.6,
      exitThreshold: 0.4,
      pyramidingEnabled: false,
      maxPyramidLevels: 3,
      minHoldTime: 60000,       // 1 minute
      maxHoldTime: 86400000,    // 24 hours
      custom: {},
      ...params,
    };
    
    this.state = {
      isActive: false,
      currentSignal: null,
      lastSignalTime: 0,
      totalSignals: 0,
      winningSignals: 0,
      losingSignals: 0,
    };
  }
  
  async initialize(): Promise<void> {
    this.state.isActive = true;
  }
  
  abstract evaluateTick(trade: NormalizedTrade): Signal | null;
  abstract evaluateKline(kline: NormalizedKline): Signal | null;
  
  evaluateKlines(klines: NormalizedKline[]): Signal | null {
    if (klines.length === 0) return null;
    return this.evaluateKline(klines[klines.length - 1]);
  }
  
  updateParameters(params: Partial<StrategyParameters>): void {
    this.parameters = { ...this.parameters, ...params };
  }
  
  backtest(klines: NormalizedKline[], startBalance: number): BacktestResult {
    const trades: BacktestTrade[] = [];
    let balance = startBalance;
    let position: { side: 'long' | 'short'; entryPrice: number; quantity: number; entryTime: number } | null = null;
    let maxBalance = startBalance;
    let maxDrawdown = 0;
    
    for (let i = 50; i < klines.length; i++) {
      const signal = this.evaluateKlines(klines.slice(Math.max(0, i - 200), i + 1));
      const kline = klines[i];
      
      if (!signal) continue;
      
      // Close existing position if opposite signal
      if (position) {
        if ((position.side === 'long' && signal.type === 'SHORT') ||
            (position.side === 'short' && signal.type === 'LONG') ||
            signal.type === 'CLOSE_LONG' || signal.type === 'CLOSE_SHORT') {
          
          const exitPrice = kline.close;
          const pnl = position.side === 'long'
            ? (exitPrice - position.entryPrice) * position.quantity
            : (position.entryPrice - exitPrice) * position.quantity;
          const fees = position.quantity * position.entryPrice * 0.001; // 0.1% fee
          
          trades.push({
            entryTime: position.entryTime,
            exitTime: kline.timestamp,
            symbol: kline.symbol,
            side: position.side,
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity,
            pnl: pnl - fees,
            pnlPercent: (pnl - fees) / (position.entryPrice * position.quantity),
            fees,
          });
          
          balance += pnl - fees;
          maxBalance = Math.max(maxBalance, balance);
          maxDrawdown = Math.max(maxDrawdown, (maxBalance - balance) / maxBalance);
          
          position = null;
        }
      }
      
      // Open new position
      if (!position && (signal.type === 'LONG' || signal.type === 'SHORT')) {
        const positionSize = balance * this.parameters.maxPositionSize;
        const quantity = positionSize / kline.close;
        
        position = {
          side: signal.type === 'LONG' ? 'long' : 'short',
          entryPrice: kline.close,
          quantity,
          entryTime: kline.timestamp,
        };
      }
    }
    
    // Close any remaining position
    if (position && klines.length > 0) {
      const lastKline = klines[klines.length - 1];
      const pnl = position.side === 'long'
        ? (lastKline.close - position.entryPrice) * position.quantity
        : (position.entryPrice - lastKline.close) * position.quantity;
      const fees = position.quantity * position.entryPrice * 0.001;
      
      trades.push({
        entryTime: position.entryTime,
        exitTime: lastKline.timestamp,
        symbol: lastKline.symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: lastKline.close,
        quantity: position.quantity,
        pnl: pnl - fees,
        pnlPercent: (pnl - fees) / (position.entryPrice * position.quantity),
        fees,
      });
      
      balance += pnl - fees;
    }
    
    // Calculate statistics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    const returns = trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1)
    );
    
    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      profitFactor: losingTrades.reduce((s, t) => s + Math.abs(t.pnl), 0) > 0
        ? winningTrades.reduce((s, t) => s + t.pnl, 0) / losingTrades.reduce((s, t) => s + Math.abs(t.pnl), 0)
        : 0,
      sharpeRatio: stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0,
      sortinoRatio: (() => {
        const negReturns = returns.filter(r => r < 0);
        const downDev = Math.sqrt(negReturns.reduce((sum, r) => sum + r * r, 0) / (negReturns.length || 1));
        return downDev > 0 ? (avgReturn / downDev) * Math.sqrt(252) : 0;
      })(),
      maxDrawdown,
      totalReturn: (balance - startBalance) / startBalance,
      annualizedReturn: 0, // Requires date range calculation
      averageWin: winningTrades.length > 0
        ? winningTrades.reduce((s, t) => s + t.pnl, 0) / winningTrades.length
        : 0,
      averageLoss: losingTrades.length > 0
        ? losingTrades.reduce((s, t) => s + Math.abs(t.pnl), 0) / losingTrades.length
        : 0,
      maxConsecutiveWins: this.calculateMaxConsecutive(trades, true),
      maxConsecutiveLosses: this.calculateMaxConsecutive(trades, false),
      trades,
    };
  }
  
  private calculateMaxConsecutive(trades: BacktestTrade[], winning: boolean): number {
    let max = 0;
    let current = 0;
    
    for (const trade of trades) {
      if ((winning && trade.pnl > 0) || (!winning && trade.pnl <= 0)) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    
    return max;
  }
  
  reset(): void {
    this.state = {
      isActive: false,
      currentSignal: null,
      lastSignalTime: 0,
      totalSignals: 0,
      winningSignals: 0,
      losingSignals: 0,
    };
  }
  
  dispose(): void {
    this.reset();
  }
  
  // Helper to create a signal
  protected createSignal(
    type: SignalType,
    symbol: string,
    strength: number,
    confidence: number,
    metadata?: Record<string, unknown>
  ): Signal {
    const signal: Signal = {
      type,
      symbol,
      strength: Math.max(0, Math.min(1, strength)),
      confidence: Math.max(0, Math.min(1, confidence)),
      source: this.id,
      timestamp: Date.now(),
      metadata,
    };
    
    this.state.currentSignal = signal;
    this.state.lastSignalTime = signal.timestamp;
    this.state.totalSignals++;
    
    return signal;
  }
}
