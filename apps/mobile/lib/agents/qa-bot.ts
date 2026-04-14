/**
 * QA Bot Agent - Risk Management & Code Review
 * 
 * Responsibilities:
 * - Trade-level risk checks (max loss, position size)
 * - Portfolio-level risk checks (max drawdown, exposure limits)
 * - Event-based trading halts (volatility, news)
 * - Code review (look-ahead bias, survivorship bias)
 * - Automated testing and validation
 */

import { TradingRule, Trade, Portfolio, StrategyDNA } from "../trading-store";

export interface RiskViolation {
  type: "trade" | "portfolio" | "event" | "code";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  details?: any;
}

export interface RiskLimits {
  // Trade-level
  maxLossPerTrade: number; // Percentage (default: 1%)
  maxPositionSize: number; // Percentage of capital (default: 5%)
  stopLossPercent: number; // Percentage (default: 1%)
  
  // Portfolio-level
  maxDrawdown: number; // Percentage (default: 10%)
  maxSectorExposure: number; // Percentage (default: 30%)
  maxLeverage: number; // Multiplier (default: 2x for paper, 1x for live)
  
  // Event-based
  volatilityHaltThreshold: number; // VIX level (default: 30)
  tradingHoursOnly: boolean; // Default: true
  haltOnHighImpactNews: boolean; // Default: true
}

export interface CodeReviewResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export class QABotAgent {
  private riskLimits: RiskLimits;
  private violations: RiskViolation[] = [];
  
  constructor(riskLimits?: Partial<RiskLimits>) {
    this.riskLimits = {
      maxLossPerTrade: 1,
      maxPositionSize: 5,
      stopLossPercent: 1,
      maxDrawdown: 10,
      maxSectorExposure: 30,
      maxLeverage: 2,
      volatilityHaltThreshold: 30,
      tradingHoursOnly: true,
      haltOnHighImpactNews: true,
      ...riskLimits,
    };
  }
  
  /**
   * Validate a trade before execution
   */
  validateTrade(
    trade: Partial<Trade>,
    portfolio: Portfolio
  ): { valid: boolean; violations: RiskViolation[] } {
    const violations: RiskViolation[] = [];
    
    // Check position size
    const positionSize = (trade.size! * trade.price! / portfolio.virtualBalance) * 100;
    if (positionSize > this.riskLimits.maxPositionSize) {
      violations.push({
        type: "trade",
        severity: "high",
        message: `Position size ${positionSize.toFixed(2)}% exceeds limit of ${this.riskLimits.maxPositionSize}%`,
        timestamp: new Date(),
        details: { positionSize, limit: this.riskLimits.maxPositionSize },
      });
    }
    
    // Check potential loss
    const tradeValue = trade.size! * trade.price!;
    const potentialLoss = (tradeValue * this.riskLimits.stopLossPercent) / 100;
    const lossPercent = (potentialLoss / portfolio.virtualBalance) * 100;
    if (lossPercent > this.riskLimits.maxLossPerTrade) {
      violations.push({
        type: "trade",
        severity: "critical",
        message: `Potential loss ${lossPercent.toFixed(2)}% exceeds limit of ${this.riskLimits.maxLossPerTrade}%`,
        timestamp: new Date(),
        details: { lossPercent, limit: this.riskLimits.maxLossPerTrade },
      });
    }
    
    // Check leverage
    const totalExposure = portfolio.positions.reduce((sum, p) => sum + (p.size * p.currentPrice), 0);
    const leverage = totalExposure / portfolio.virtualBalance;
    if (leverage > this.riskLimits.maxLeverage) {
      violations.push({
        type: "portfolio",
        severity: "high",
        message: `Leverage ${leverage.toFixed(2)}x exceeds limit of ${this.riskLimits.maxLeverage}x`,
        timestamp: new Date(),
        details: { leverage, limit: this.riskLimits.maxLeverage },
      });
    }
    
    this.violations.push(...violations);
    return {
      valid: violations.length === 0,
      violations,
    };
  }
  
  /**
   * Check portfolio-level risk
   */
  checkPortfolioRisk(
    portfolio: Portfolio,
    startBalance: number
  ): { safe: boolean; violations: RiskViolation[] } {
    const violations: RiskViolation[] = [];
    
    // Check drawdown
    const drawdown = ((startBalance - portfolio.virtualBalance) / startBalance) * 100;
    if (drawdown > this.riskLimits.maxDrawdown) {
      violations.push({
        type: "portfolio",
        severity: "critical",
        message: `Drawdown ${drawdown.toFixed(2)}% exceeds limit of ${this.riskLimits.maxDrawdown}%`,
        timestamp: new Date(),
        details: { drawdown, limit: this.riskLimits.maxDrawdown },
      });
    }
    
    // Check sector exposure (simplified - assumes symbol prefix indicates sector)
    const sectorExposure = new Map<string, number>();
    portfolio.positions.forEach((pos) => {
      const sector = pos.symbol.substring(0, 2); // Simplified sector detection
      const current = sectorExposure.get(sector) || 0;
      sectorExposure.set(sector, current + (pos.size * pos.currentPrice));
    });
    
    sectorExposure.forEach((exposure, sector) => {
      const exposurePercent = (exposure / portfolio.virtualBalance) * 100;
      if (exposurePercent > this.riskLimits.maxSectorExposure) {
        violations.push({
          type: "portfolio",
          severity: "medium",
          message: `Sector ${sector} exposure ${exposurePercent.toFixed(2)}% exceeds limit of ${this.riskLimits.maxSectorExposure}%`,
          timestamp: new Date(),
          details: { sector, exposurePercent, limit: this.riskLimits.maxSectorExposure },
        });
      }
    });
    
    this.violations.push(...violations);
    return {
      safe: violations.filter((v) => v.severity === "critical").length === 0,
      violations,
    };
  }
  
  /**
   * Check if trading should be halted due to market conditions
   */
  shouldHaltTrading(marketConditions: {
    vix?: number;
    isMarketHours?: boolean;
    highImpactNews?: boolean;
  }): { halt: boolean; reason?: string } {
    // Check VIX (volatility)
    if (marketConditions.vix && marketConditions.vix > this.riskLimits.volatilityHaltThreshold) {
      this.violations.push({
        type: "event",
        severity: "high",
        message: `High volatility: VIX ${marketConditions.vix} exceeds threshold ${this.riskLimits.volatilityHaltThreshold}`,
        timestamp: new Date(),
        details: { vix: marketConditions.vix, threshold: this.riskLimits.volatilityHaltThreshold },
      });
      return {
        halt: true,
        reason: `High volatility (VIX: ${marketConditions.vix})`,
      };
    }
    
    // Check market hours
    if (this.riskLimits.tradingHoursOnly && marketConditions.isMarketHours === false) {
      return {
        halt: true,
        reason: "Market is closed",
      };
    }
    
    // Check high-impact news
    if (this.riskLimits.haltOnHighImpactNews && marketConditions.highImpactNews) {
      this.violations.push({
        type: "event",
        severity: "medium",
        message: "High-impact news detected, halting trading",
        timestamp: new Date(),
      });
      return {
        halt: true,
        reason: "High-impact news event",
      };
    }
    
    return { halt: false };
  }
  
  /**
   * Review trading rule code for common pitfalls
   */
  reviewRuleCode(rule: TradingRule): CodeReviewResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check success rate
    if (rule.successRate < 0.5) {
      issues.push(`Low success rate: ${(rule.successRate * 100).toFixed(1)}%. Rule may not be profitable`);
    }
    
    // Check confidence
    if (rule.confidence < 0.6) {
      warnings.push(`Low confidence: ${(rule.confidence * 100).toFixed(1)}%. Consider more training data`);
    }
    
    // Check if rule has been tested enough
    if (rule.totalTrades < 10) {
      warnings.push(`Insufficient trades: ${rule.totalTrades}. Need at least 10 trades for validation`);
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
    };
  }
  
  /**
   * Review strategy DNA for common pitfalls
   */
  reviewStrategyDNA(strategy: StrategyDNA): CodeReviewResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for unrealistic parameters
    if (strategy.riskLevel > 0.7) {
      warnings.push(`High risk level: ${(strategy.riskLevel * 100).toFixed(0)}%. Consider reducing below 70%`);
    }
    
    // Check performance metrics
    if (strategy.sharpeRatio < 1.0) {
      issues.push(`Low Sharpe ratio: ${strategy.sharpeRatio.toFixed(2)}. Target is ≥1.5`);
    }
    
    if (strategy.maxDrawdown > 20) {
      issues.push(`High max drawdown: ${strategy.maxDrawdown.toFixed(1)}%. Target is <20%`);
    }
    
    if (strategy.winRate < 0.5) {
      issues.push(`Low win rate: ${(strategy.winRate * 100).toFixed(1)}%. Target is ≥50%`);
    }
    
    // Check if strategy has been tested enough
    if (strategy.totalTrades < 50) {
      warnings.push(`Insufficient trades: ${strategy.totalTrades}. Need at least 50 trades for validation`);
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
    };
  }
  
  /**
   * Validate strategy performance metrics
   */
  validateStrategyMetrics(metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor?: number;
  }): { approved: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Sharpe ratio check (target: ≥1.5)
    if (metrics.sharpeRatio < 1.5) {
      reasons.push(`Sharpe ratio ${metrics.sharpeRatio.toFixed(2)} below target of 1.5`);
    }
    
    // Max drawdown check (target: <20%)
    if (metrics.maxDrawdown > 20) {
      reasons.push(`Max drawdown ${metrics.maxDrawdown.toFixed(2)}% exceeds limit of 20%`);
    }
    
    // Win rate check (target: ≥50%)
    if (metrics.winRate < 50) {
      reasons.push(`Win rate ${metrics.winRate.toFixed(2)}% below target of 50%`);
    }
    
    // Profit factor check (target: >1.5)
    if (metrics.profitFactor && metrics.profitFactor < 1.5) {
      reasons.push(`Profit factor ${metrics.profitFactor.toFixed(2)} below target of 1.5`);
    }
    
    return {
      approved: reasons.length === 0,
      reasons,
    };
  }
  
  /**
   * Get all violations
   */
  getViolations(severity?: RiskViolation["severity"]): RiskViolation[] {
    if (severity) {
      return this.violations.filter((v) => v.severity === severity);
    }
    return this.violations;
  }
  
  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = [];
  }
  
  /**
   * Get risk limits
   */
  getRiskLimits(): RiskLimits {
    return { ...this.riskLimits };
  }
  
  /**
   * Update risk limits
   */
  updateRiskLimits(limits: Partial<RiskLimits>): void {
    this.riskLimits = { ...this.riskLimits, ...limits };
  }
  
  /**
   * Generate risk report
   */
  generateRiskReport(): {
    totalViolations: number;
    criticalViolations: number;
    recentViolations: RiskViolation[];
    riskScore: number; // 0-100, lower is better
  } {
    const critical = this.violations.filter((v) => v.severity === "critical").length;
    const high = this.violations.filter((v) => v.severity === "high").length;
    const medium = this.violations.filter((v) => v.severity === "medium").length;
    
    // Calculate risk score (weighted)
    const riskScore = Math.min(100, critical * 25 + high * 10 + medium * 5);
    
    // Get recent violations (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentViolations = this.violations.filter((v) => v.timestamp > oneDayAgo);
    
    return {
      totalViolations: this.violations.length,
      criticalViolations: critical,
      recentViolations,
      riskScore,
    };
  }
}
