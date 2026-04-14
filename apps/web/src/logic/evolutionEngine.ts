/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - GENETIC ALGORITHM EVOLUTION ENGINE
 * Self-evolving strategy optimization with user phenotype mapping
 * GOLD STATUS: phenotypeToGenotype mapping for GSM control
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { actions, StrategyDNA } from '../store';
import { newsOracle } from './newsOracle';
import { quantumEdge } from './quantumEdge';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface EvolutionConfig {
  populationSize: number;
  eliteCount: number;
  mutationRate: number;
  crossoverRate: number;
  selectionPressure: number;
  generationLimit: number;
  fitnessThreshold: number;
}

export interface EvolutionStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  worstFitness: number;
  diversity: number;
  convergence: number;
}

export interface Phenotype2D {
  x: number;  // Risk level (0-1)
  y: number;  // Time horizon (0-1)
}

export interface GenotypeEncoding {
  genome: string;
  parameters: {
    riskLevel: number;
    timeHorizon: number;
    trendBias: number;
    volatilityAffinity: number;
    entanglementWeight: number;
    sentimentWeight: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHENOTYPE TO GENOTYPE MAPPING (GOLD STATUS FEATURE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core GSM function: Translates user's 2D visual input into a genome string
 * This simulates an autoencoder that maps phenotype space to genotype space
 * 
 * @param phenotype_x - X coordinate in phenotype space (risk level, 0-1)
 * @param phenotype_y - Y coordinate in phenotype space (time horizon, 0-1)
 * @returns Encoded genome string ready for GA selection pressure
 */
export function phenotypeToGenotypeMapping(
  phenotype_x: number,
  phenotype_y: number
): string {
  // Clamp inputs to valid range
  const x = Math.max(0, Math.min(1, phenotype_x));
  const y = Math.max(0, Math.min(1, phenotype_y));
  
  // Map phenotype to additional parameters using learned correlations
  // (In production, this would be a trained neural network/autoencoder)
  
  // Trend bias correlates with risk - high risk prefers trend following
  const trendBias = 0.5 + (x - 0.5) * 0.6;
  
  // Volatility affinity inversely correlates with time horizon
  const volatilityAffinity = 1 - y * 0.8;
  
  // Entanglement weight based on complexity preference
  const entanglementWeight = Math.sqrt(x * y);
  
  // Sentiment weight based on time horizon (longer = less reactive)
  const sentimentWeight = 1 - y * 0.5;
  
  // Encode to genome string
  const encoding: GenotypeEncoding = {
    genome: '',
    parameters: {
      riskLevel: x,
      timeHorizon: y,
      trendBias,
      volatilityAffinity,
      entanglementWeight,
      sentimentWeight,
    },
  };
  
  // Generate genome string (base64 encoded parameter vector)
  const paramVector = [
    x, y, trendBias, volatilityAffinity, entanglementWeight, sentimentWeight
  ];
  
  // Convert to hex-encoded string for compact representation
  const genomeString = paramVector
    .map(p => Math.round(p * 255).toString(16).padStart(2, '0'))
    .join('');
  
  // Add checksum for integrity
  const checksum = paramVector.reduce((a, b) => a + b, 0) % 256;
  encoding.genome = genomeString + checksum.toString(16).padStart(2, '0');
  
  actions.addLog('quantum', 'GSM', 
    `phenotypeToGenotype: (${x.toFixed(2)}, ${y.toFixed(2)}) → ${encoding.genome.slice(0, 12)}...`
  );
  
  return encoding.genome;
}

/**
 * Decode genome string back to parameters
 */
export function genotypeToParameters(genome: string): GenotypeEncoding['parameters'] | null {
  try {
    if (genome.length < 14) return null;
    
    const params: number[] = [];
    for (let i = 0; i < 12; i += 2) {
      params.push(parseInt(genome.slice(i, i + 2), 16) / 255);
    }
    
    return {
      riskLevel: params[0],
      timeHorizon: params[1],
      trendBias: params[2],
      volatilityAffinity: params[3],
      entanglementWeight: params[4],
      sentimentWeight: params[5],
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENETIC ALGORITHM CORE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single-point crossover between two parent genomes
 */
export function crossover(parentA: StrategyDNA, parentB: StrategyDNA): StrategyDNA {
  const crossoverPoint = Math.random();
  
  const child: StrategyDNA = {
    genomeId: `GENOME-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    genomeString: '',
    generation: Math.max(parentA.generation, parentB.generation) + 1,
    sharpeRatio: 0,
    sortinoRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    profitFactor: 0,
    totalTrades: 0,
    
    // Crossover phenotype parameters
    riskLevel: crossoverPoint < 0.5 ? parentA.riskLevel : parentB.riskLevel,
    timeHorizon: crossoverPoint < 0.5 ? parentB.timeHorizon : parentA.timeHorizon,
    trendBias: Math.random() < 0.5 ? parentA.trendBias : parentB.trendBias,
    volatilityAffinity: Math.random() < 0.5 ? parentA.volatilityAffinity : parentB.volatilityAffinity,
    
    // Inherit quantum features (average)
    entanglementScore: (parentA.entanglementScore + parentB.entanglementScore) / 2,
    lastSentiment: (parentA.lastSentiment + parentB.lastSentiment) / 2,
    
    isActive: false,
    isSurvivalDna: false,
    fitnessRank: 0,
  };
  
  // Generate genome string from new parameters
  child.genomeString = phenotypeToGenotypeMapping(child.riskLevel, child.timeHorizon);
  
  return child;
}

/**
 * Mutate a genome with given mutation rate
 */
export function mutate(dna: StrategyDNA, mutationRate: number): void {
  const mutationStrength = 0.15;
  
  // Mutate each parameter with probability = mutationRate
  if (Math.random() < mutationRate) {
    dna.riskLevel = clamp(dna.riskLevel + (Math.random() - 0.5) * mutationStrength);
  }
  if (Math.random() < mutationRate) {
    dna.timeHorizon = clamp(dna.timeHorizon + (Math.random() - 0.5) * mutationStrength);
  }
  if (Math.random() < mutationRate) {
    dna.trendBias = clamp(dna.trendBias + (Math.random() - 0.5) * mutationStrength);
  }
  if (Math.random() < mutationRate) {
    dna.volatilityAffinity = clamp(dna.volatilityAffinity + (Math.random() - 0.5) * mutationStrength);
  }
  
  // Re-encode genome after mutation
  dna.genomeString = phenotypeToGenotypeMapping(dna.riskLevel, dna.timeHorizon);
}

/**
 * Tournament selection with user phenotype bias
 */
export function select(
  population: StrategyDNA[],
  count: number,
  userBias: Phenotype2D | null = null
): StrategyDNA[] {
  const selected: StrategyDNA[] = [];
  const tournamentSize = 3;
  
  for (let i = 0; i < count; i++) {
    // Random tournament
    const tournament: StrategyDNA[] = [];
    for (let j = 0; j < tournamentSize; j++) {
      const idx = Math.floor(Math.random() * population.length);
      tournament.push(population[idx]);
    }
    
    // Sort by biased fitness
    tournament.sort((a, b) => {
      const fitnessA = calculateBiasedFitness(a, userBias);
      const fitnessB = calculateBiasedFitness(b, userBias);
      return fitnessB - fitnessA;
    });
    
    selected.push({ ...tournament[0] }); // Clone winner
  }
  
  return selected;
}

/**
 * Calculate fitness with optional user phenotype bias
 * User's visual input receives highest evolutionary pressure
 */
function calculateBiasedFitness(dna: StrategyDNA, userBias: Phenotype2D | null): number {
  // Base fitness from performance metrics
  const baseFitness = calculateBaseFitness(dna);
  
  if (!userBias) return baseFitness;
  
  // Calculate distance from user-selected point in phenotype space
  const dx = dna.riskLevel - userBias.x;
  const dy = dna.timeHorizon - userBias.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Max distance in unit square = sqrt(2) ≈ 1.414
  const proximityBonus = 1 - (distance / 1.414);
  
  // Blend: 70% base fitness + 30% proximity to user selection
  // This gives user's visual input significant evolutionary pressure
  return 0.7 * baseFitness + 0.3 * proximityBonus;
}

/**
 * Calculate base fitness from strategy metrics
 */
function calculateBaseFitness(dna: StrategyDNA): number {
  // Weighted fitness formula
  const sharpeScore = Math.max(-2, Math.min(4, dna.sharpeRatio)) / 4;
  const sortinoScore = Math.max(-2, Math.min(4, dna.sortinoRatio)) / 4;
  const drawdownPenalty = 1 - Math.min(1, dna.maxDrawdown);
  const winRateScore = dna.winRate;
  const profitFactorScore = Math.min(3, dna.profitFactor) / 3;
  
  // Include quantum features
  const entanglementBonus = dna.entanglementScore * 0.1;
  
  const fitness = 
    0.35 * sharpeScore +
    0.15 * sortinoScore +
    0.20 * drawdownPenalty +
    0.10 * winRateScore +
    0.10 * profitFactorScore +
    0.10 * entanglementBonus;
  
  return Math.max(0, Math.min(1, fitness));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVOLUTION ENGINE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class EvolutionEngine {
  private config: EvolutionConfig;
  private population: StrategyDNA[] = [];
  private generation: number = 0;
  private bestGenome: StrategyDNA | null = null;
  private userBias: Phenotype2D | null = null;
  private isRunning: boolean = false;
  private evolutionInterval: number | null = null;
  
  constructor() {
    this.config = {
      populationSize: 50,
      eliteCount: 5,
      mutationRate: 0.15,
      crossoverRate: 0.8,
      selectionPressure: 2.0,
      generationLimit: 1000,
      fitnessThreshold: 0.95,
    };
  }
  
  /**
   * Initialize population with random genomes
   */
  initializePopulation(): void {
    this.population = [];
    
    for (let i = 0; i < this.config.populationSize; i++) {
      const dna = this.createRandomGenome();
      this.population.push(dna);
    }
    
    this.evaluatePopulation();
    this.updateRankings();
    
    actions.addLog('info', 'GA', `Initialized population with ${this.config.populationSize} genomes`);
    actions.updatePopulation(this.population);
  }
  
  /**
   * Create a random genome
   */
  private createRandomGenome(): StrategyDNA {
    const riskLevel = Math.random();
    const timeHorizon = Math.random();
    
    return {
      genomeId: `GENOME-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      genomeString: phenotypeToGenotypeMapping(riskLevel, timeHorizon),
      generation: 0,
      sharpeRatio: (Math.random() * 4) - 1,
      sortinoRatio: (Math.random() * 4) - 1,
      maxDrawdown: Math.random() * 0.3,
      winRate: 0.4 + Math.random() * 0.3,
      profitFactor: 0.8 + Math.random() * 1.5,
      totalTrades: Math.floor(Math.random() * 500) + 100,
      riskLevel,
      timeHorizon,
      trendBias: Math.random(),
      volatilityAffinity: Math.random(),
      entanglementScore: quantumEdge.getEntanglementScore(),
      lastSentiment: newsOracle.getAggregatedSentiment(),
      isActive: false,
      isSurvivalDna: false,
      fitnessRank: 0,
    };
  }
  
  /**
   * Run one evolution cycle
   */
  evolve(): EvolutionStats {
    this.generation++;
    
    // Update environmental factors
    const currentSentiment = newsOracle.getAggregatedSentiment();
    const currentEntanglement = quantumEdge.getEntanglementScore();
    
    // Update population with environmental data
    this.population.forEach(dna => {
      dna.lastSentiment = currentSentiment;
      dna.entanglementScore = currentEntanglement;
    });
    
    // Selection
    const selected = select(
      this.population,
      this.config.populationSize - this.config.eliteCount,
      this.userBias
    );
    
    // Create new population
    const newPopulation: StrategyDNA[] = [];
    
    // Elitism: Keep best genomes
    const elite = this.population
      .sort((a, b) => calculateBiasedFitness(b, this.userBias) - calculateBiasedFitness(a, this.userBias))
      .slice(0, this.config.eliteCount);
    
    newPopulation.push(...elite.map(d => ({ ...d })));
    
    // Crossover and mutation
    while (newPopulation.length < this.config.populationSize) {
      const parentA = selected[Math.floor(Math.random() * selected.length)];
      const parentB = selected[Math.floor(Math.random() * selected.length)];
      
      let child: StrategyDNA;
      
      if (Math.random() < this.config.crossoverRate) {
        child = crossover(parentA, parentB);
      } else {
        child = { ...parentA, genomeId: `GENOME-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}` };
      }
      
      mutate(child, this.config.mutationRate);
      
      // Simulate backtest results (in production, would run actual backtest)
      this.simulateBacktest(child);
      
      newPopulation.push(child);
    }
    
    this.population = newPopulation;
    this.evaluatePopulation();
    this.updateRankings();
    
    // Calculate stats
    const fitnesses = this.population.map(d => calculateBiasedFitness(d, this.userBias));
    const stats: EvolutionStats = {
      generation: this.generation,
      bestFitness: Math.max(...fitnesses),
      avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      worstFitness: Math.min(...fitnesses),
      diversity: this.calculateDiversity(),
      convergence: this.calculateConvergence(),
    };
    
    // Update stores
    this.bestGenome = this.population[0];
    actions.setActiveGenome(this.bestGenome);
    actions.updatePopulation(this.population);
    
    // Log progress
    if (this.generation % 10 === 0) {
      actions.addLog('info', 'GA', 
        `Gen ${this.generation}: Best=${stats.bestFitness.toFixed(3)} Avg=${stats.avgFitness.toFixed(3)} Div=${stats.diversity.toFixed(2)}`
      );
    }
    
    return stats;
  }
  
  /**
   * Simulate backtest for a genome (placeholder for real backtest)
   */
  private simulateBacktest(dna: StrategyDNA): void {
    // In production, would run actual backtest on historical data
    // For now, simulate results with some correlation to parameters
    
    const basePerformance = 0.5 + Math.random() * 0.5;
    const riskEffect = (0.5 - Math.abs(dna.riskLevel - 0.5)) * 0.3;
    const horizonEffect = (0.5 - Math.abs(dna.timeHorizon - 0.5)) * 0.2;
    
    dna.sharpeRatio = (basePerformance + riskEffect + horizonEffect) * 3 - 0.5 + (Math.random() - 0.5);
    dna.sortinoRatio = dna.sharpeRatio * (0.8 + Math.random() * 0.4);
    dna.maxDrawdown = 0.05 + dna.riskLevel * 0.2 + Math.random() * 0.1;
    dna.winRate = 0.4 + basePerformance * 0.2 + Math.random() * 0.1;
    dna.profitFactor = 0.8 + basePerformance * 1.2 + Math.random() * 0.5;
    dna.totalTrades = Math.floor(100 + Math.random() * 400);
  }
  
  /**
   * Evaluate and rank population
   */
  private evaluatePopulation(): void {
    this.population.sort((a, b) => 
      calculateBiasedFitness(b, this.userBias) - calculateBiasedFitness(a, this.userBias)
    );
  }
  
  /**
   * Update fitness rankings
   */
  private updateRankings(): void {
    this.population.forEach((dna, idx) => {
      dna.fitnessRank = idx + 1;
      dna.isActive = idx === 0;
    });
  }
  
  /**
   * Calculate population diversity
   */
  private calculateDiversity(): number {
    if (this.population.length < 2) return 0;
    
    let totalDistance = 0;
    let count = 0;
    
    for (let i = 0; i < Math.min(10, this.population.length); i++) {
      for (let j = i + 1; j < Math.min(10, this.population.length); j++) {
        const dx = this.population[i].riskLevel - this.population[j].riskLevel;
        const dy = this.population[i].timeHorizon - this.population[j].timeHorizon;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
        count++;
      }
    }
    
    return count > 0 ? totalDistance / count : 0;
  }
  
  /**
   * Calculate convergence (how similar top genomes are)
   */
  private calculateConvergence(): number {
    if (this.population.length < 5) return 0;
    
    const top5 = this.population.slice(0, 5);
    const avgRisk = top5.reduce((s, d) => s + d.riskLevel, 0) / 5;
    const avgHorizon = top5.reduce((s, d) => s + d.timeHorizon, 0) / 5;
    
    let variance = 0;
    top5.forEach(d => {
      variance += Math.pow(d.riskLevel - avgRisk, 2);
      variance += Math.pow(d.timeHorizon - avgHorizon, 2);
    });
    
    return 1 - Math.min(1, Math.sqrt(variance / 10));
  }
  
  /**
   * Set user phenotype bias from GSM selection
   */
  setUserBias(x: number, y: number): void {
    this.userBias = { x: clamp(x), y: clamp(y) };
    
    actions.addLog('quantum', 'GA', 
      `User bias set: Risk=${(x * 100).toFixed(0)}% Horizon=${(y * 100).toFixed(0)}%`
    );
    
    // Generate target genome for reference
    phenotypeToGenotypeMapping(x, y);
  }
  
  /**
   * Clear user bias
   */
  clearUserBias(): void {
    this.userBias = null;
    actions.addLog('info', 'GA', 'User bias cleared - natural selection resumed');
  }
  
  /**
   * Start continuous evolution
   */
  startEvolution(intervalMs: number = 2000): void {
    if (this.isRunning) return;
    
    if (this.population.length === 0) {
      this.initializePopulation();
    }
    
    this.isRunning = true;
    actions.addLog('success', 'GA', '🧬 Evolution cycle started');
    
    this.evolutionInterval = window.setInterval(() => {
      this.evolve();
    }, intervalMs);
  }
  
  /**
   * Stop evolution
   */
  stopEvolution(): void {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
      this.evolutionInterval = null;
    }
    this.isRunning = false;
    actions.addLog('info', 'GA', 'Evolution cycle paused');
  }
  
  /**
   * Get current population
   */
  getPopulation(): StrategyDNA[] {
    return [...this.population];
  }
  
  /**
   * Get best genome
   */
  getBestGenome(): StrategyDNA | null {
    return this.bestGenome;
  }
  
  /**
   * Get current generation
   */
  getGeneration(): number {
    return this.generation;
  }
  
  /**
   * Check if running
   */
  isEvolutionRunning(): boolean {
    return this.isRunning;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const evolutionEngine = new EvolutionEngine();
