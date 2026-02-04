import AsyncStorage from "@react-native-async-storage/async-storage";

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  openedAt: string;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  size: number;
  price: number;
  leverage: number;
  executedAt: string;
  pnl: number;
  pnlPercent: number;
  status: "open" | "closed" | "cancelled";
  closedAt?: string;
  closePrice?: number;
  // Learning data
  marketConditions: MarketConditions;
  newssentiment: number;
  outcome: "win" | "loss" | "pending";
}

export interface MarketConditions {
  trend: "bullish" | "bearish" | "neutral";
  volatility: "low" | "medium" | "high";
  volume: "low" | "normal" | "high";
  sentiment: number; // -1 to 1
}

export interface TradingRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  action: "buy" | "sell" | "hold";
  confidence: number;
  successRate: number;
  totalTrades: number;
  createdAt: string;
  lastTriggered?: string;
  isActive: boolean;
}

export interface RuleCondition {
  type: "sentiment" | "trend" | "volatility" | "price_change" | "volume";
  operator: ">" | "<" | "=" | ">=" | "<=";
  value: number | string;
}

export interface StrategyDNA {
  genomeId: string;
  genomeString: string;
  generation: number;
  // Performance metrics
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  // Strategy parameters
  riskLevel: number; // 0-1
  timeHorizon: number; // 0-1
  trendBias: number; // 0-1
  volatilityAffinity: number; // 0-1
  sentimentWeight: number; // 0-1
  // State
  isActive: boolean;
  fitnessRank: number;
}

export interface NewsItem {
  id: string;
  timestamp: string;
  source: string;
  headline: string;
  summary?: string;
  sentiment: SentimentResult;
  symbols: string[];
}

export interface SentimentResult {
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  magnitude: number; // 0 to 1
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  keywords: string[];
}

export interface LearningEntry {
  id: string;
  timestamp: string;
  type: "rule_created" | "rule_updated" | "pattern_detected" | "strategy_evolved";
  description: string;
  details: Record<string, unknown>;
}

export interface Portfolio {
  virtualBalance: number;
  startingBalance: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnLPercent: number;
  positions: Position[];
}

export interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
}

export interface GeneticAlgorithmState {
  isRunning: boolean;
  generation: number;
  populationSize: number;
  bestFitness: number;
  avgFitness: number;
  diversity: number;
  population: StrategyDNA[];
  activeStrategy: StrategyDNA | null;
}

export interface TradingAppState {
  portfolio: Portfolio;
  trades: Trade[];
  rules: TradingRule[];
  news: NewsItem[];
  learningHistory: LearningEntry[];
  stats: TradingStats;
  geneticAlgorithm: GeneticAlgorithmState;
  aggregatedSentiment: number;
  marketConditions: MarketConditions;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const STARTING_BALANCE = 10000;

const initialMarketConditions: MarketConditions = {
  trend: "neutral",
  volatility: "medium",
  volume: "normal",
  sentiment: 0,
};

const initialStats: TradingStats = {
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0,
  avgWin: 0,
  avgLoss: 0,
  bestTrade: 0,
  worstTrade: 0,
  sharpeRatio: 0,
  maxDrawdown: 0,
  profitFactor: 0,
};

const initialPortfolio: Portfolio = {
  virtualBalance: STARTING_BALANCE,
  startingBalance: STARTING_BALANCE,
  unrealizedPnL: 0,
  realizedPnL: 0,
  totalPnLPercent: 0,
  positions: [],
};

// Sample initial trading rules (learned patterns)
const initialRules: TradingRule[] = [
  {
    id: "rule-1",
    name: "Bullish Sentiment Entry",
    description: "Kaufen wenn Marktstimmung stark positiv ist",
    conditions: [
      { type: "sentiment", operator: ">", value: 0.5 },
      { type: "trend", operator: "=", value: "bullish" },
    ],
    action: "buy",
    confidence: 0.72,
    successRate: 0.68,
    totalTrades: 45,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    isActive: true,
  },
  {
    id: "rule-2",
    name: "High Volatility Exit",
    description: "Verkaufen bei hoher Volatilität um Verluste zu begrenzen",
    conditions: [
      { type: "volatility", operator: "=", value: "high" },
      { type: "sentiment", operator: "<", value: -0.3 },
    ],
    action: "sell",
    confidence: 0.65,
    successRate: 0.71,
    totalTrades: 28,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isActive: true,
  },
  {
    id: "rule-3",
    name: "Trend Following",
    description: "Mit dem Trend handeln bei stabilen Bedingungen",
    conditions: [
      { type: "volatility", operator: "=", value: "low" },
      { type: "volume", operator: "=", value: "normal" },
    ],
    action: "buy",
    confidence: 0.58,
    successRate: 0.62,
    totalTrades: 67,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isActive: true,
  },
];

// Sample news items
const initialNews: NewsItem[] = [
  {
    id: "news-1",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    source: "CryptoNews",
    headline: "Bitcoin ETF verzeichnet Rekordzuflüsse - Institutionelle Adoption wächst",
    summary: "Die Bitcoin-ETFs haben in der vergangenen Woche über 1 Milliarde Dollar an Zuflüssen verzeichnet.",
    sentiment: { score: 0.75, confidence: 0.85, magnitude: 0.8, impact: "HIGH", keywords: ["ETF", "institutional", "adoption"] },
    symbols: ["BTC"],
  },
  {
    id: "news-2",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    source: "MarketWatch",
    headline: "Fed signalisiert mögliche Zinssenkungen im kommenden Quartal",
    summary: "Die Federal Reserve deutet an, dass Zinssenkungen früher als erwartet kommen könnten.",
    sentiment: { score: 0.45, confidence: 0.78, magnitude: 0.6, impact: "MEDIUM", keywords: ["Fed", "rates", "monetary policy"] },
    symbols: ["BTC", "ETH"],
  },
  {
    id: "news-3",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    source: "Bloomberg",
    headline: "Ethereum Upgrade erfolgreich abgeschlossen - Netzwerk effizienter",
    summary: "Das neueste Ethereum-Upgrade wurde erfolgreich implementiert und verbessert die Skalierbarkeit.",
    sentiment: { score: 0.6, confidence: 0.82, magnitude: 0.7, impact: "MEDIUM", keywords: ["Ethereum", "upgrade", "scalability"] },
    symbols: ["ETH"],
  },
];

// Sample learning history
const initialLearningHistory: LearningEntry[] = [
  {
    id: "learn-1",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: "pattern_detected",
    description: "Muster erkannt: Positive News-Sentiment korreliert mit 68% Wahrscheinlichkeit zu Kursanstieg",
    details: { pattern: "sentiment_price_correlation", confidence: 0.68 },
  },
  {
    id: "learn-2",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    type: "rule_created",
    description: "Neue Regel erstellt: 'High Volatility Exit' basierend auf 28 analysierten Trades",
    details: { ruleId: "rule-2", basedOnTrades: 28 },
  },
];

// Initial genetic algorithm state
const initialGAState: GeneticAlgorithmState = {
  isRunning: false,
  generation: 0,
  populationSize: 50,
  bestFitness: 0,
  avgFitness: 0,
  diversity: 1.0,
  population: [],
  activeStrategy: null,
};

const STORAGE_KEY = "aether_trading_state";

// ═══════════════════════════════════════════════════════════════════════════
// STORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function loadTradingState(): Promise<TradingAppState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading trading state:", error);
  }

  // Return initial state
  return {
    portfolio: initialPortfolio,
    trades: [],
    rules: initialRules,
    news: initialNews,
    learningHistory: initialLearningHistory,
    stats: initialStats,
    geneticAlgorithm: initialGAState,
    aggregatedSentiment: 0.4,
    marketConditions: initialMarketConditions,
    lastUpdated: new Date().toISOString(),
  };
}

export async function saveTradingState(state: TradingAppState): Promise<void> {
  try {
    state.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving trading state:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function executeTrade(
  symbol: string,
  side: "buy" | "sell",
  size: number,
  leverage: number = 1
): Promise<{ success: boolean; message: string; trade?: Trade }> {
  const state = await loadTradingState();

  // Get current price (simulated)
  const currentPrice = getSimulatedPrice(symbol);
  const totalCost = size * currentPrice;

  // Check if enough balance
  if (side === "buy" && totalCost > state.portfolio.virtualBalance) {
    return { success: false, message: "Nicht genügend Guthaben für diesen Trade" };
  }

  // Create trade
  const trade: Trade = {
    id: `trade-${Date.now()}`,
    symbol,
    side,
    type: "market",
    size,
    price: currentPrice,
    leverage,
    executedAt: new Date().toISOString(),
    pnl: 0,
    pnlPercent: 0,
    status: "open",
    marketConditions: state.marketConditions,
    newssentiment: state.aggregatedSentiment,
    outcome: "pending",
  };

  // Update portfolio
  if (side === "buy") {
    state.portfolio.virtualBalance -= totalCost;
    
    // Create or update position
    const existingPosition = state.portfolio.positions.find(
      (p) => p.symbol === symbol && p.side === "long"
    );
    
    if (existingPosition) {
      // Average down/up
      const totalSize = existingPosition.size + size;
      existingPosition.entryPrice =
        (existingPosition.entryPrice * existingPosition.size + currentPrice * size) / totalSize;
      existingPosition.size = totalSize;
    } else {
      const position: Position = {
        id: `pos-${Date.now()}`,
        symbol,
        side: "long",
        size,
        entryPrice: currentPrice,
        currentPrice,
        leverage,
        openedAt: new Date().toISOString(),
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
      };
      state.portfolio.positions.push(position);
    }
  } else {
    // Sell - close or reduce position
    const position = state.portfolio.positions.find(
      (p) => p.symbol === symbol && p.side === "long"
    );
    
    if (position) {
      const sellSize = Math.min(size, position.size);
      const pnl = (currentPrice - position.entryPrice) * sellSize * leverage;
      
      trade.pnl = pnl;
      trade.pnlPercent = (pnl / (position.entryPrice * sellSize)) * 100;
      trade.status = "closed";
      trade.closedAt = new Date().toISOString();
      trade.closePrice = currentPrice;
      trade.outcome = pnl >= 0 ? "win" : "loss";
      
      state.portfolio.virtualBalance += sellSize * currentPrice + pnl;
      state.portfolio.realizedPnL += pnl;
      
      position.size -= sellSize;
      if (position.size <= 0) {
        state.portfolio.positions = state.portfolio.positions.filter((p) => p.id !== position.id);
      }
      
      // Update stats
      updateStats(state, trade);
      
      // Learn from trade
      await learnFromTrade(state, trade);
    } else {
      return { success: false, message: "Keine offene Position zum Verkaufen" };
    }
  }

  state.trades.unshift(trade);
  
  // Update total P&L percent
  state.portfolio.totalPnLPercent =
    ((state.portfolio.virtualBalance + state.portfolio.unrealizedPnL - STARTING_BALANCE) / STARTING_BALANCE) * 100;

  await saveTradingState(state);

  return {
    success: true,
    message: `${side === "buy" ? "Kauf" : "Verkauf"} von ${size} ${symbol} bei €${currentPrice.toFixed(2)} ausgeführt`,
    trade,
  };
}

function updateStats(state: TradingAppState, trade: Trade): void {
  const closedTrades = state.trades.filter((t) => t.status === "closed");
  
  state.stats.totalTrades = closedTrades.length;
  state.stats.winningTrades = closedTrades.filter((t) => t.pnl > 0).length;
  state.stats.losingTrades = closedTrades.filter((t) => t.pnl < 0).length;
  state.stats.winRate = state.stats.totalTrades > 0 
    ? state.stats.winningTrades / state.stats.totalTrades 
    : 0;
  
  const wins = closedTrades.filter((t) => t.pnl > 0);
  const losses = closedTrades.filter((t) => t.pnl < 0);
  
  state.stats.avgWin = wins.length > 0 
    ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length 
    : 0;
  state.stats.avgLoss = losses.length > 0 
    ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) 
    : 0;
  
  state.stats.bestTrade = Math.max(...closedTrades.map((t) => t.pnl), 0);
  state.stats.worstTrade = Math.min(...closedTrades.map((t) => t.pnl), 0);
  
  state.stats.profitFactor = state.stats.avgLoss > 0 
    ? state.stats.avgWin / state.stats.avgLoss 
    : 0;
  
  // Calculate Sharpe ratio (simplified)
  if (closedTrades.length > 1) {
    const returns = closedTrades.map((t) => t.pnlPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    state.stats.sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SELF-LEARNING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function learnFromTrade(state: TradingAppState, trade: Trade): Promise<void> {
  // Analyze trade outcome and market conditions
  const { marketConditions, newssentiment, outcome, side } = trade;
  
  // Find matching rules
  const matchingRules = state.rules.filter((rule) => {
    return rule.conditions.every((condition) => {
      switch (condition.type) {
        case "sentiment":
          return evaluateCondition(newssentiment, condition.operator, condition.value as number);
        case "trend":
          return marketConditions.trend === condition.value;
        case "volatility":
          return marketConditions.volatility === condition.value;
        case "volume":
          return marketConditions.volume === condition.value;
        default:
          return false;
      }
    });
  });
  
  // Update rule success rates
  matchingRules.forEach((rule) => {
    rule.totalTrades++;
    if ((outcome === "win" && rule.action === side) || (outcome === "loss" && rule.action !== side)) {
      rule.successRate = (rule.successRate * (rule.totalTrades - 1) + 1) / rule.totalTrades;
    } else {
      rule.successRate = (rule.successRate * (rule.totalTrades - 1)) / rule.totalTrades;
    }
    rule.lastTriggered = new Date().toISOString();
  });
  
  // Check if we should create a new rule based on pattern
  if (state.trades.filter((t) => t.status === "closed").length % 10 === 0) {
    const newRule = detectPattern(state);
    if (newRule) {
      state.rules.push(newRule);
      state.learningHistory.unshift({
        id: `learn-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "rule_created",
        description: `Neue Regel erstellt: "${newRule.name}" basierend auf Musteranalyse`,
        details: { ruleId: newRule.id, conditions: newRule.conditions },
      });
    }
  }
}

function detectPattern(state: TradingAppState): TradingRule | null {
  const closedTrades = state.trades.filter((t) => t.status === "closed").slice(0, 20);
  if (closedTrades.length < 10) return null;
  
  // Analyze winning trades
  const winningTrades = closedTrades.filter((t) => t.outcome === "win");
  if (winningTrades.length < 5) return null;
  
  // Find common conditions in winning trades
  const sentimentSum = winningTrades.reduce((sum, t) => sum + t.newssentiment, 0);
  const avgSentiment = sentimentSum / winningTrades.length;
  
  const trendCounts: Record<string, number> = { bullish: 0, bearish: 0, neutral: 0 };
  winningTrades.forEach((t) => trendCounts[t.marketConditions.trend]++);
  const dominantTrend = Object.entries(trendCounts).sort((a, b) => b[1] - a[1])[0][0];
  
  // Create new rule if pattern is strong enough
  const confidence = winningTrades.length / closedTrades.length;
  if (confidence > 0.6) {
    return {
      id: `rule-${Date.now()}`,
      name: `Auto-Regel ${state.rules.length + 1}`,
      description: `Automatisch erkanntes Muster: ${dominantTrend} Trend mit Sentiment ${avgSentiment > 0 ? "positiv" : "negativ"}`,
      conditions: [
        { type: "trend", operator: "=", value: dominantTrend },
        { type: "sentiment", operator: avgSentiment > 0 ? ">" : "<", value: avgSentiment > 0 ? 0.2 : -0.2 },
      ],
      action: "buy",
      confidence,
      successRate: confidence,
      totalTrades: winningTrades.length,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
  }
  
  return null;
}

function evaluateCondition(value: number, operator: string, target: number): boolean {
  switch (operator) {
    case ">": return value > target;
    case "<": return value < target;
    case ">=": return value >= target;
    case "<=": return value <= target;
    case "=": return Math.abs(value - target) < 0.1;
    default: return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GENETIC ALGORITHM FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function initializePopulation(): Promise<void> {
  const state = await loadTradingState();
  
  const population: StrategyDNA[] = [];
  for (let i = 0; i < 50; i++) {
    population.push(createRandomGenome(i));
  }
  
  // Sort by fitness
  population.sort((a, b) => calculateFitness(b) - calculateFitness(a));
  population.forEach((dna, idx) => {
    dna.fitnessRank = idx + 1;
    dna.isActive = idx === 0;
  });
  
  state.geneticAlgorithm.population = population;
  state.geneticAlgorithm.activeStrategy = population[0];
  state.geneticAlgorithm.generation = 1;
  state.geneticAlgorithm.bestFitness = calculateFitness(population[0]);
  state.geneticAlgorithm.avgFitness = population.reduce((sum, dna) => sum + calculateFitness(dna), 0) / population.length;
  
  state.learningHistory.unshift({
    id: `learn-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "strategy_evolved",
    description: `Genetischer Algorithmus initialisiert mit ${population.length} Strategien`,
    details: { generation: 1, bestFitness: state.geneticAlgorithm.bestFitness },
  });
  
  await saveTradingState(state);
}

function createRandomGenome(index: number): StrategyDNA {
  const riskLevel = Math.random();
  const timeHorizon = Math.random();
  
  return {
    genomeId: `GENOME-${Date.now()}-${index.toString().padStart(4, "0")}`,
    genomeString: encodeGenome(riskLevel, timeHorizon),
    generation: 1,
    sharpeRatio: (Math.random() * 4) - 1,
    sortinoRatio: (Math.random() * 4) - 1,
    maxDrawdown: Math.random() * 0.3,
    winRate: 0.4 + Math.random() * 0.3,
    profitFactor: 0.8 + Math.random() * 1.5,
    totalTrades: Math.floor(Math.random() * 100) + 10,
    riskLevel,
    timeHorizon,
    trendBias: Math.random(),
    volatilityAffinity: Math.random(),
    sentimentWeight: Math.random(),
    isActive: false,
    fitnessRank: 0,
  };
}

function encodeGenome(riskLevel: number, timeHorizon: number): string {
  const trendBias = 0.5 + (riskLevel - 0.5) * 0.6;
  const volatilityAffinity = 1 - timeHorizon * 0.8;
  const sentimentWeight = 1 - timeHorizon * 0.5;
  
  const params = [riskLevel, timeHorizon, trendBias, volatilityAffinity, sentimentWeight];
  return params.map((p) => Math.round(p * 255).toString(16).padStart(2, "0")).join("");
}

/**
 * Calculate fitness for a genome
 * Enhanced with Transfer Learning predictions when model is trained
 * ML predictions can influence strategy selection by providing confidence scores
 */
function calculateFitness(dna: StrategyDNA): number {
  const sharpeScore = Math.max(-2, Math.min(4, dna.sharpeRatio)) / 4;
  const drawdownPenalty = 1 - Math.min(1, dna.maxDrawdown);
  const winRateScore = dna.winRate;
  const profitFactorScore = Math.min(3, dna.profitFactor) / 3;
  
  // Base fitness calculation
  const baseFitness = 0.35 * sharpeScore + 0.25 * drawdownPenalty + 0.20 * winRateScore + 0.20 * profitFactorScore;
  
  // ML boost will be applied when Transfer Learning model makes predictions
  // This creates a hybrid approach: GA for strategy evolution + ML for pattern recognition
  return baseFitness;
}

export async function evolveGeneration(): Promise<{ success: boolean; stats: { generation: number; bestFitness: number; avgFitness: number } }> {
  const state = await loadTradingState();
  const { population } = state.geneticAlgorithm;
  
  if (population.length === 0) {
    return { success: false, stats: { generation: 0, bestFitness: 0, avgFitness: 0 } };
  }
  
  // Selection - tournament selection
  const selected: StrategyDNA[] = [];
  for (let i = 0; i < population.length - 5; i++) {
    const tournament = [];
    for (let j = 0; j < 3; j++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    tournament.sort((a, b) => calculateFitness(b) - calculateFitness(a));
    selected.push({ ...tournament[0] });
  }
  
  // Elitism - keep top 5
  const elite = population.slice(0, 5).map((dna) => ({ ...dna }));
  
  // Crossover and mutation
  const newPopulation: StrategyDNA[] = [...elite];
  
  while (newPopulation.length < population.length) {
    const parentA = selected[Math.floor(Math.random() * selected.length)];
    const parentB = selected[Math.floor(Math.random() * selected.length)];
    
    // Crossover
    const child: StrategyDNA = {
      ...parentA,
      genomeId: `GENOME-${Date.now()}-${newPopulation.length.toString().padStart(4, "0")}`,
      generation: state.geneticAlgorithm.generation + 1,
      riskLevel: Math.random() < 0.5 ? parentA.riskLevel : parentB.riskLevel,
      timeHorizon: Math.random() < 0.5 ? parentA.timeHorizon : parentB.timeHorizon,
      trendBias: (parentA.trendBias + parentB.trendBias) / 2,
      volatilityAffinity: (parentA.volatilityAffinity + parentB.volatilityAffinity) / 2,
      sentimentWeight: (parentA.sentimentWeight + parentB.sentimentWeight) / 2,
      isActive: false,
    };
    
    // Mutation
    if (Math.random() < 0.15) {
      child.riskLevel = Math.max(0, Math.min(1, child.riskLevel + (Math.random() - 0.5) * 0.2));
    }
    if (Math.random() < 0.15) {
      child.timeHorizon = Math.max(0, Math.min(1, child.timeHorizon + (Math.random() - 0.5) * 0.2));
    }
    
    // Simulate backtest
    child.sharpeRatio = (Math.random() * 4) - 1;
    child.winRate = 0.4 + Math.random() * 0.3;
    child.maxDrawdown = Math.random() * 0.3;
    child.profitFactor = 0.8 + Math.random() * 1.5;
    
    child.genomeString = encodeGenome(child.riskLevel, child.timeHorizon);
    
    newPopulation.push(child);
  }
  
  // Sort and rank
  newPopulation.sort((a, b) => calculateFitness(b) - calculateFitness(a));
  newPopulation.forEach((dna, idx) => {
    dna.fitnessRank = idx + 1;
    dna.isActive = idx === 0;
  });
  
  // Update state
  state.geneticAlgorithm.population = newPopulation;
  state.geneticAlgorithm.activeStrategy = newPopulation[0];
  state.geneticAlgorithm.generation++;
  state.geneticAlgorithm.bestFitness = calculateFitness(newPopulation[0]);
  state.geneticAlgorithm.avgFitness = newPopulation.reduce((sum, dna) => sum + calculateFitness(dna), 0) / newPopulation.length;
  state.geneticAlgorithm.diversity = calculateDiversity(newPopulation);
  
  // Log evolution
  if (state.geneticAlgorithm.generation % 10 === 0) {
    state.learningHistory.unshift({
      id: `learn-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "strategy_evolved",
      description: `Generation ${state.geneticAlgorithm.generation}: Beste Fitness ${state.geneticAlgorithm.bestFitness.toFixed(3)}`,
      details: { generation: state.geneticAlgorithm.generation, bestFitness: state.geneticAlgorithm.bestFitness },
    });
  }
  
  await saveTradingState(state);
  
  return {
    success: true,
    stats: {
      generation: state.geneticAlgorithm.generation,
      bestFitness: state.geneticAlgorithm.bestFitness,
      avgFitness: state.geneticAlgorithm.avgFitness,
    },
  };
}

function calculateDiversity(population: StrategyDNA[]): number {
  if (population.length < 2) return 1;
  
  let totalDistance = 0;
  let comparisons = 0;
  
  for (let i = 0; i < Math.min(10, population.length); i++) {
    for (let j = i + 1; j < Math.min(10, population.length); j++) {
      const dx = population[i].riskLevel - population[j].riskLevel;
      const dy = population[i].timeHorizon - population[j].timeHorizon;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalDistance / comparisons : 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS SENTIMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function analyzeSentiment(headline: string): Promise<SentimentResult> {
  const text = headline.toLowerCase();
  
  const bullishKeywords = ["rally", "surge", "gain", "bullish", "up", "rise", "growth", "adoption", "approval", "etf", "institutional", "steigt", "wächst", "positiv"];
  const bearishKeywords = ["crash", "drop", "fall", "bearish", "down", "decline", "hack", "ban", "regulation", "sec", "lawsuit", "fällt", "sinkt", "negativ"];
  const highImpactKeywords = ["breaking", "urgent", "flash", "crash", "hack", "etf", "fed", "rate", "halving", "eilmeldung"];
  
  let bullishCount = 0;
  let bearishCount = 0;
  let impactScore = 0;
  const foundKeywords: string[] = [];
  
  bullishKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      bullishCount++;
      foundKeywords.push(kw);
    }
  });
  
  bearishKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      bearishCount++;
      foundKeywords.push(kw);
    }
  });
  
  highImpactKeywords.forEach((kw) => {
    if (text.includes(kw)) impactScore++;
  });
  
  const total = bullishCount + bearishCount;
  let score = 0;
  if (total > 0) {
    score = (bullishCount - bearishCount) / total;
  } else {
    score = (Math.random() - 0.5) * 0.2;
  }
  
  const confidence = Math.min(0.95, 0.3 + (total / 5) * 0.6);
  const magnitude = Math.min(1, total / 4);
  
  let impact: SentimentResult["impact"];
  if (impactScore >= 2 || magnitude > 0.8) {
    impact = "CRITICAL";
  } else if (impactScore >= 1 || magnitude > 0.5) {
    impact = "HIGH";
  } else if (magnitude > 0.3) {
    impact = "MEDIUM";
  } else {
    impact = "LOW";
  }
  
  return { score, confidence, magnitude, impact, keywords: foundKeywords };
}

export async function updateAggregatedSentiment(): Promise<number> {
  const state = await loadTradingState();
  
  // Calculate EMA of recent news sentiment
  const recentNews = state.news.slice(0, 10);
  if (recentNews.length === 0) return 0;
  
  let ema = recentNews[0].sentiment.score;
  const alpha = 0.2;
  
  for (let i = 1; i < recentNews.length; i++) {
    ema = alpha * recentNews[i].sentiment.score + (1 - alpha) * ema;
  }
  
  state.aggregatedSentiment = ema;
  state.marketConditions.sentiment = ema;
  state.marketConditions.trend = ema > 0.3 ? "bullish" : ema < -0.3 ? "bearish" : "neutral";
  
  await saveTradingState(state);
  
  return ema;
}

export async function addNewsItem(headline: string, source: string, symbols: string[]): Promise<NewsItem> {
  const state = await loadTradingState();
  
  const sentiment = await analyzeSentiment(headline);
  
  const newsItem: NewsItem = {
    id: `news-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source,
    headline,
    sentiment,
    symbols,
  };
  
  state.news.unshift(newsItem);
  if (state.news.length > 100) {
    state.news = state.news.slice(0, 100);
  }
  
  await saveTradingState(state);
  await updateAggregatedSentiment();
  
  return newsItem;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getSimulatedPrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    "BTC/EUR": 42000,
    "ETH/EUR": 2200,
    "SOL/EUR": 95,
    "XRP/EUR": 0.55,
  };
  
  const base = basePrices[symbol] || 100;
  const volatility = 0.02;
  const change = (Math.random() - 0.5) * 2 * volatility;
  
  return base * (1 + change);
}

export async function updatePositionPrices(): Promise<void> {
  const state = await loadTradingState();
  
  let totalUnrealizedPnL = 0;
  
  state.portfolio.positions.forEach((position) => {
    const currentPrice = getSimulatedPrice(position.symbol);
    position.currentPrice = currentPrice;
    
    const pnl = (currentPrice - position.entryPrice) * position.size * position.leverage;
    position.unrealizedPnL = pnl;
    position.unrealizedPnLPercent = (pnl / (position.entryPrice * position.size)) * 100;
    
    totalUnrealizedPnL += pnl;
  });
  
  state.portfolio.unrealizedPnL = totalUnrealizedPnL;
  state.portfolio.totalPnLPercent =
    ((state.portfolio.virtualBalance + totalUnrealizedPnL - STARTING_BALANCE) / STARTING_BALANCE) * 100;
  
  await saveTradingState(state);
}

export async function resetTradingState(): Promise<void> {
  const initialState: TradingAppState = {
    portfolio: { ...initialPortfolio },
    trades: [],
    rules: initialRules.map((r) => ({ ...r })),
    news: initialNews.map((n) => ({ ...n })),
    learningHistory: [],
    stats: { ...initialStats },
    geneticAlgorithm: { ...initialGAState, population: [], activeStrategy: null },
    aggregatedSentiment: 0.4,
    marketConditions: { ...initialMarketConditions },
    lastUpdated: new Date().toISOString(),
  };
  
  await saveTradingState(initialState);
}
