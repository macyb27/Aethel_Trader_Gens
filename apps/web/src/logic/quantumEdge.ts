/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - QUANTUM EDGE DETECTOR
 * Orderflow analysis with quantum-inspired correlation metrics
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { actions } from '../store';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderflowData {
  timestamp: number;
  buyVolume: number;
  sellVolume: number;
  deltaVolume: number;  // buy - sell
  price: number;
  trades: number;
  largeOrders: number;  // Orders > threshold
}

export interface EntanglementResult {
  score: number;          // 0.0 to 1.0
  correlation: number;    // -1.0 to 1.0
  coherence: number;      // 0.0 to 1.0
  phase: number;          // 0 to 2π
  confidence: number;     // 0.0 to 1.0
  signals: QuantumSignal[];
}

export interface QuantumSignal {
  type: 'ENTANGLEMENT' | 'DECOHERENCE' | 'SUPERPOSITION' | 'COLLAPSE';
  strength: number;
  timestamp: number;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM STATE SIMULATOR (PLACEHOLDER FOR QuTiP WASM)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates quantum state evolution using classical approximation
 * In production, this would use QuTiP compiled to WASM
 */
class QuantumStateSimulator {
  private state: Float64Array;
  private dimension: number;
  
  constructor(dimension: number = 8) {
    this.dimension = dimension;
    this.state = new Float64Array(dimension * 2); // Complex numbers
    this.initialize();
  }
  
  private initialize(): void {
    // Initialize to superposition state
    const norm = 1 / Math.sqrt(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      this.state[i * 2] = norm;     // Real part
      this.state[i * 2 + 1] = 0;    // Imaginary part
    }
  }
  
  /**
   * Apply Hadamard-like transformation based on market data
   */
  evolve(marketFactor: number): void {
    const angle = marketFactor * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const newState = new Float64Array(this.state.length);
    
    for (let i = 0; i < this.dimension; i++) {
      const re = this.state[i * 2];
      const im = this.state[i * 2 + 1];
      
      newState[i * 2] = re * cos - im * sin;
      newState[i * 2 + 1] = re * sin + im * cos;
    }
    
    this.state = newState;
  }
  
  /**
   * Calculate entanglement entropy (simplified)
   */
  calculateEntanglement(): number {
    let entropy = 0;
    let normSquared = 0;
    
    for (let i = 0; i < this.dimension; i++) {
      const re = this.state[i * 2];
      const im = this.state[i * 2 + 1];
      const prob = re * re + im * im;
      normSquared += prob;
      
      if (prob > 1e-10) {
        entropy -= prob * Math.log2(prob);
      }
    }
    
    // Normalize to 0-1 range
    const maxEntropy = Math.log2(this.dimension);
    return Math.min(1, Math.max(0, entropy / maxEntropy));
  }
  
  /**
   * Get coherence measure
   */
  getCoherence(): number {
    let offDiagonalSum = 0;
    
    for (let i = 0; i < this.dimension; i++) {
      const re = this.state[i * 2];
      const im = this.state[i * 2 + 1];
      offDiagonalSum += Math.sqrt(re * re + im * im);
    }
    
    return offDiagonalSum / this.dimension;
  }
  
  /**
   * Get phase information
   */
  getPhase(): number {
    const re = this.state[0];
    const im = this.state[1];
    return Math.atan2(im, re);
  }
  
  reset(): void {
    this.initialize();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM EDGE DETECTOR
// ─────────────────────────────────────────────────────────────────────────────

class QuantumEdgeDetector {
  private simulator: QuantumStateSimulator;
  private orderflowHistory: OrderflowData[] = [];
  private maxHistory: number = 1000;
  private lastResult: EntanglementResult | null = null;
  
  // Moving averages for stability
  private emaShort: number = 0;
  private emaLong: number = 0;
  private volatility: number = 0;
  
  constructor() {
    this.simulator = new QuantumStateSimulator(8);
  }
  
  /**
   * Process new orderflow data and calculate entanglement score
   */
  processOrderflow(data: OrderflowData): EntanglementResult {
    // Add to history
    this.orderflowHistory.push(data);
    if (this.orderflowHistory.length > this.maxHistory) {
      this.orderflowHistory.shift();
    }
    
    // Update EMAs
    this.updateEMAs(data);
    
    // Normalize delta for quantum evolution
    const normalizedDelta = this.normalizeDelta(data.deltaVolume);
    
    // Evolve quantum state based on market data
    this.simulator.evolve(normalizedDelta);
    
    // Calculate entanglement metrics
    const entanglement = this.simulator.calculateEntanglement();
    const coherence = this.simulator.getCoherence();
    const phase = this.simulator.getPhase();
    
    // Calculate cross-timeframe correlation
    const correlation = this.calculateCorrelation();
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(data);
    
    // Detect quantum signals
    const signals = this.detectSignals(entanglement, coherence, correlation);
    
    const result: EntanglementResult = {
      score: entanglement,
      correlation,
      coherence,
      phase,
      confidence,
      signals,
    };
    
    this.lastResult = result;
    
    return result;
  }
  
  private updateEMAs(data: OrderflowData): void {
    const alphaShort = 0.1;
    const alphaLong = 0.02;
    
    const delta = data.deltaVolume;
    
    this.emaShort = alphaShort * delta + (1 - alphaShort) * this.emaShort;
    this.emaLong = alphaLong * delta + (1 - alphaLong) * this.emaLong;
    
    // Update volatility
    const diff = Math.abs(delta - this.emaLong);
    this.volatility = alphaLong * diff + (1 - alphaLong) * this.volatility;
  }
  
  private normalizeDelta(delta: number): number {
    // Normalize to -1 to 1 range using sigmoid-like function
    const scale = this.volatility > 0 ? this.volatility * 3 : 1000;
    return Math.tanh(delta / scale);
  }
  
  private calculateCorrelation(): number {
    if (this.orderflowHistory.length < 20) return 0;
    
    const recent = this.orderflowHistory.slice(-20);
    const prices = recent.map(d => d.price);
    const deltas = recent.map(d => d.deltaVolume);
    
    // Pearson correlation
    const n = prices.length;
    const sumX = prices.reduce((a, b) => a + b, 0);
    const sumY = deltas.reduce((a, b) => a + b, 0);
    const sumXY = prices.reduce((sum, p, i) => sum + p * deltas[i], 0);
    const sumX2 = prices.reduce((sum, p) => sum + p * p, 0);
    const sumY2 = deltas.reduce((sum, d) => sum + d * d, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator > 0 ? numerator / denominator : 0;
  }
  
  private calculateConfidence(data: OrderflowData): number {
    let confidence = 0.5;
    
    // More trades = higher confidence
    confidence += Math.min(0.2, data.trades / 1000);
    
    // More history = higher confidence
    confidence += Math.min(0.2, this.orderflowHistory.length / this.maxHistory);
    
    // Lower volatility = higher confidence
    if (this.volatility > 0) {
      confidence += Math.min(0.1, 1000 / this.volatility);
    }
    
    return Math.min(1, Math.max(0, confidence));
  }
  
  private detectSignals(entanglement: number, coherence: number, correlation: number): QuantumSignal[] {
    const signals: QuantumSignal[] = [];
    const timestamp = Date.now();
    
    // Entanglement signal: High score indicates strong market coupling
    if (entanglement > 0.8) {
      signals.push({
        type: 'ENTANGLEMENT',
        strength: entanglement,
        timestamp,
        description: 'Strong market entanglement detected - increased predictability',
      });
    }
    
    // Decoherence signal: Rapid drop in coherence
    if (this.lastResult && this.lastResult.coherence - coherence > 0.3) {
      signals.push({
        type: 'DECOHERENCE',
        strength: this.lastResult.coherence - coherence,
        timestamp,
        description: 'Quantum decoherence - market regime change possible',
      });
    }
    
    // Superposition signal: Equal probability states
    if (coherence > 0.9 && Math.abs(correlation) < 0.1) {
      signals.push({
        type: 'SUPERPOSITION',
        strength: coherence,
        timestamp,
        description: 'Market in superposition state - uncertainty high',
      });
    }
    
    // Collapse signal: Strong directional move
    if (Math.abs(correlation) > 0.8) {
      signals.push({
        type: 'COLLAPSE',
        strength: Math.abs(correlation),
        timestamp,
        description: `State collapsed to ${correlation > 0 ? 'bullish' : 'bearish'} direction`,
      });
    }
    
    return signals;
  }
  
  /**
   * Get the current entanglement score (0.0 to 1.0)
   * This is the primary output used by the GSM visualization
   */
  getEntanglementScore(): number {
    return this.lastResult?.score ?? 0;
  }
  
  /**
   * Get full analysis result
   */
  getLastResult(): EntanglementResult | null {
    return this.lastResult;
  }
  
  /**
   * Reset the detector state
   */
  reset(): void {
    this.simulator.reset();
    this.orderflowHistory = [];
    this.emaShort = 0;
    this.emaLong = 0;
    this.volatility = 0;
    this.lastResult = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const quantumEdge = new QuantumEdgeDetector();

// ─────────────────────────────────────────────────────────────────────────────
// DEMO: Simulate orderflow processing
// ─────────────────────────────────────────────────────────────────────────────

export function startQuantumEdgeSimulation(): () => void {
  let price = 42000;
  
  const interval = setInterval(() => {
    // Generate simulated orderflow
    const buyVolume = Math.random() * 100;
    const sellVolume = Math.random() * 100;
    
    price += (buyVolume - sellVolume) * 0.1;
    
    const data: OrderflowData = {
      timestamp: Date.now(),
      buyVolume,
      sellVolume,
      deltaVolume: buyVolume - sellVolume,
      price,
      trades: Math.floor(Math.random() * 500),
      largeOrders: Math.floor(Math.random() * 10),
    };
    
    const result = quantumEdge.processOrderflow(data);
    
    // Log significant events
    if (result.signals.length > 0) {
      result.signals.forEach(signal => {
        actions.addLog('quantum', 'QUANTUM', `◈ ${signal.type}: ${signal.description}`);
      });
    }
    
    // Periodic score update
    if (Math.random() > 0.9) {
      actions.addLog('quantum', 'QUANTUM', 
        `Entanglement: ${(result.score * 100).toFixed(1)}% | ` +
        `Coherence: ${(result.coherence * 100).toFixed(1)}% | ` +
        `Correlation: ${(result.correlation * 100).toFixed(1)}%`
      );
    }
  }, 1000);
  
  return () => clearInterval(interval);
}
