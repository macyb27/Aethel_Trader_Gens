/**
 * Backtesting Engine
 * 
 * Tests trading strategies against historical data to validate performance
 * before deploying to paper or live trading.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { TradingRule } from "../trading-store";

const execAsync = promisify(exec);

export interface BacktestBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestTrade {
  entryTime: string;
  exitTime: string;
  side: "buy" | "sell";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
}

export interface BacktestResult {
  symbol: string;
  period: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  
  // Performance metrics
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor: number;
  
  // Trade statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // Time-based metrics
  avgHoldingPeriod: number; // in hours
  longestWinStreak: number;
  longestLossStreak: number;
  
  // Risk metrics
  valueAtRisk95: number; // 95% VaR
  conditionalVaR95: number; // CVaR (Expected Shortfall)
  
  // Trades
  trades: BacktestTrade[];
  
  // Equity curve
  equityCurve: Array<{ timestamp: string; equity: number }>;
  
  // Pass/Fail
  passed: boolean;
  passReason: string;
}

export interface BacktestStrategy {
  name: string;
  rules: TradingRule[];
  riskPerTrade: number; // Percentage of capital to risk per trade
  maxPositionSize: number; // Max percentage of capital in single position
  stopLossPercent: number;
  takeProfitPercent: number;
}

/**
 * Fetch historical data using yfinance Python script
 */
async function fetchHistoricalData(
  symbol: string,
  period: string = "2y",
  interval: string = "1d"
): Promise<{ success: boolean; data?: BacktestBar[]; error?: string }> {
  try {
    const { stdout } = await execAsync(
      `python3 /home/ubuntu/easygeld-pro/scripts/fetch-historical-data.py ${symbol} ${period} ${interval}`
    );
    
    const result = JSON.parse(stdout);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return {
      success: true,
      data: result.data as BacktestBar[],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate technical indicators
 */
function calculateIndicators(bars: BacktestBar[]): {
  sma20: number[];
  sma50: number[];
  rsi: number[];
  volatility: number[];
} {
  const closes = bars.map(b => b.close);
  
  // Simple Moving Averages
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  
  // RSI
  const rsi = calculateRSI(closes, 14);
  
  // Volatility (20-day rolling standard deviation)
  const volatility = calculateRollingStd(closes, 20);
  
  return { sma20, sma50, rsi, volatility };
}

function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  
  return result;
}

function calculateRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  // Calculate RSI
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }
  
  return result;
}

function calculateRollingStd(data: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      result.push(Math.sqrt(variance));
    }
  }
  
  return result;
}

/**
 * Evaluate trading rules against current market conditions
 */
function evaluateRules(
  rules: TradingRule[],
  currentBar: BacktestBar,
  indicators: {
    sma20: number;
    sma50: number;
    rsi: number;
    volatility: number;
  },
  sentiment: number
): { action: "buy" | "sell" | "hold"; confidence: number } {
  let buyScore = 0;
  let sellScore = 0;
  let totalConfidence = 0;
  
  for (const rule of rules) {
    if (!rule.isActive) continue;
    
    let ruleTriggered = true;
    
    for (const condition of rule.conditions) {
      let value: number;
      
      switch (condition.type) {
        case "sentiment":
          value = sentiment;
          break;
        case "trend":
          value = indicators.sma20 > indicators.sma50 ? 1 : -1;
          break;
        case "volatility":
          value = indicators.volatility;
          break;
        case "price_change":
          value = ((currentBar.close - currentBar.open) / currentBar.open) * 100;
          break;
        default:
          value = 0;
      }
      
      // Check condition
      const condValue = typeof condition.value === "number" ? condition.value : parseFloat(condition.value);
      
      switch (condition.operator) {
        case ">":
          if (!(value > condValue)) ruleTriggered = false;
          break;
        case "<":
          if (!(value < condValue)) ruleTriggered = false;
          break;
        case ">=":
          if (!(value >= condValue)) ruleTriggered = false;
          break;
        case "<=":
          if (!(value <= condValue)) ruleTriggered = false;
          break;
        case "=":
          if (!(Math.abs(value - condValue) < 0.01)) ruleTriggered = false;
          break;
      }
    }
    
    if (ruleTriggered) {
      if (rule.action === "buy") {
        buyScore += rule.confidence;
      } else if (rule.action === "sell") {
        sellScore += rule.confidence;
      }
      totalConfidence += rule.confidence;
    }
  }
  
  if (buyScore > sellScore && buyScore > 0.5) {
    return { action: "buy", confidence: buyScore / totalConfidence };
  } else if (sellScore > buyScore && sellScore > 0.5) {
    return { action: "sell", confidence: sellScore / totalConfidence };
  } else {
    return { action: "hold", confidence: 0 };
  }
}

/**
 * Run backtest for a strategy
 */
export async function runBacktest(
  symbol: string,
  strategy: BacktestStrategy,
  period: string = "2y",
  initialCapital: number = 10000
): Promise<BacktestResult> {
  // Fetch historical data
  const { success, data, error } = await fetchHistoricalData(symbol, period, "1d");
  
  if (!success || !data) {
    throw new Error(`Failed to fetch historical data: ${error}`);
  }
  
  const bars = data;
  const indicators = calculateIndicators(bars);
  
  // Simulation state
  let capital = initialCapital;
  let position: { size: number; entryPrice: number; entryTime: string } | null = null;
  const trades: BacktestTrade[] = [];
  const equityCurve: Array<{ timestamp: string; equity: number }> = [];
  
  // Simulate trading
  for (let i = 50; i < bars.length; i++) {
    const bar = bars[i];
    const currentIndicators = {
      sma20: indicators.sma20[i],
      sma50: indicators.sma50[i],
      rsi: indicators.rsi[i],
      volatility: indicators.volatility[i],
    };
    
    // Assume neutral sentiment for backtest (can be enhanced with historical sentiment data)
    const sentiment = 0;
    
    const { action, confidence } = evaluateRules(strategy.rules, bar, currentIndicators, sentiment);
    
    // Position management
    if (!position && action === "buy") {
      // Open long position
      const positionSize = Math.min(
        (capital * strategy.maxPositionSize) / bar.close,
        (capital * strategy.riskPerTrade) / (bar.close * strategy.stopLossPercent / 100)
      );
      
      position = {
        size: positionSize,
        entryPrice: bar.close,
        entryTime: bar.timestamp,
      };
      
      capital -= positionSize * bar.close;
    } else if (position && (action === "sell" || shouldExit(bar, position, strategy))) {
      // Close position
      const exitPrice = bar.close;
      const pnl = (exitPrice - position.entryPrice) * position.size;
      const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
      
      capital += position.size * exitPrice;
      
      trades.push({
        entryTime: position.entryTime,
        exitTime: bar.timestamp,
        side: "buy",
        entryPrice: position.entryPrice,
        exitPrice,
        size: position.size,
        pnl,
        pnlPercent,
        reason: action === "sell" ? "Rule signal" : "Stop loss/Take profit",
      });
      
      position = null;
    }
    
    // Record equity
    const currentEquity = capital + (position ? position.size * bar.close : 0);
    equityCurve.push({
      timestamp: bar.timestamp,
      equity: currentEquity,
    });
  }
  
  // Close any open position at the end
  if (position) {
    const lastBar = bars[bars.length - 1];
    const exitPrice = lastBar.close;
    const pnl = (exitPrice - position.entryPrice) * position.size;
    const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
    
    capital += position.size * exitPrice;
    
    trades.push({
      entryTime: position.entryTime,
      exitTime: lastBar.timestamp,
      side: "buy",
      entryPrice: position.entryPrice,
      exitPrice,
      size: position.size,
      pnl,
      pnlPercent,
      reason: "End of backtest",
    });
  }
  
  // Calculate performance metrics
  const finalCapital = capital;
  const totalReturn = finalCapital - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);
  
  const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;
  
  // Sharpe Ratio
  const returns = trades.map(t => t.pnlPercent);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0; // Annualized
  
  // Sortino Ratio (only downside deviation)
  const downsideReturns = returns.filter(r => r < 0);
  const downsideStd = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length)
    : 0;
  const sortinoRatio = downsideStd > 0 ? (avgReturn / downsideStd) * Math.sqrt(252) : 0;
  
  // Max Drawdown
  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const drawdown = peak - point.equity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  const maxDrawdownPercent = (maxDrawdown / peak) * 100;
  
  // Pass/Fail criteria
  const passed = sharpeRatio >= 1.5 && maxDrawdownPercent < 20 && winRate >= 0.5;
  const passReason = passed
    ? "Strategy passed validation"
    : `Strategy failed: Sharpe=${sharpeRatio.toFixed(2)} (need ≥1.5), Drawdown=${maxDrawdownPercent.toFixed(1)}% (need <20%), WinRate=${(winRate * 100).toFixed(1)}% (need ≥50%)`;
  
  return {
    symbol,
    period,
    startDate: bars[0].timestamp,
    endDate: bars[bars.length - 1].timestamp,
    initialCapital,
    finalCapital,
    totalReturn,
    totalReturnPercent,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    maxDrawdownPercent,
    winRate,
    profitFactor,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin,
    avgLoss,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0,
    avgHoldingPeriod: 0, // TODO: Calculate
    longestWinStreak: 0, // TODO: Calculate
    longestLossStreak: 0, // TODO: Calculate
    valueAtRisk95: 0, // TODO: Calculate
    conditionalVaR95: 0, // TODO: Calculate
    trades,
    equityCurve,
    passed,
    passReason,
  };
}

/**
 * Check if position should be exited (stop loss / take profit)
 */
function shouldExit(
  currentBar: BacktestBar,
  position: { size: number; entryPrice: number; entryTime: string },
  strategy: BacktestStrategy
): boolean {
  const currentPrice = currentBar.close;
  const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
  
  // Stop loss
  if (pnlPercent <= -strategy.stopLossPercent) {
    return true;
  }
  
  // Take profit
  if (pnlPercent >= strategy.takeProfitPercent) {
    return true;
  }
  
  return false;
}
