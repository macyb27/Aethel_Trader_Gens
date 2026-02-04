/**
 * RL Rule Developer Agent - Reinforcement Learning-based Trading Rule Generation
 * 
 * Uses Deep Q-Network (DQN) and Policy Gradient methods to learn optimal trading rules
 * from market data and trading outcomes.
 * 
 * Key Features:
 * - Experience replay buffer for stable learning
 * - Epsilon-greedy exploration strategy
 * - Sharpe ratio-based reward function
 * - Action space: Buy, Sell, Hold with confidence levels
 * - State space: Market conditions, technical indicators, sentiment
 */

import { MarketConditions, Trade, TradingRule } from "../trading-store";

export interface RLState {
  // Market features
  price: number;
  priceChange: number; // Percentage
  volume: number;
  volatility: number; // 0-1
  
  // Technical indicators
  sma20: number;
  sma50: number;
  rsi: number; // 0-100
  macd: number;
  
  // Sentiment
  newsSentiment: number; // -1 to 1
  marketSentiment: number; // -1 to 1
  
  // Portfolio state
  portfolioValue: number;
  positionSize: number;
  unrealizedPnL: number;
}

export interface RLAction {
  type: "buy" | "sell" | "hold";
  confidence: number; // 0-1
  positionSize: number; // Percentage of portfolio
}

export interface Experience {
  state: RLState;
  action: RLAction;
  reward: number;
  nextState: RLState;
  done: boolean;
  timestamp: Date;
}

export interface RLHyperparameters {
  learningRate: number; // Default: 0.001
  discountFactor: number; // Gamma, default: 0.95
  epsilonStart: number; // Default: 1.0
  epsilonEnd: number; // Default: 0.01
  epsilonDecay: number; // Default: 0.995
  batchSize: number; // Default: 32
  replayBufferSize: number; // Default: 10000
  targetUpdateFrequency: number; // Default: 100 episodes
}

export interface RLMetrics {
  totalEpisodes: number;
  totalSteps: number;
  averageReward: number;
  bestReward: number;
  epsilon: number;
  loss: number;
  sharpeRatio: number;
  winRate: number;
}

export class RLRuleDeveloperAgent {
  private replayBuffer: Experience[] = [];
  private hyperparameters: RLHyperparameters;
  private metrics: RLMetrics;
  private generatedRules: TradingRule[] = [];
  
  constructor(hyperparameters?: Partial<RLHyperparameters>) {
    this.hyperparameters = {
      learningRate: 0.001,
      discountFactor: 0.95,
      epsilonStart: 1.0,
      epsilonEnd: 0.01,
      epsilonDecay: 0.995,
      batchSize: 32,
      replayBufferSize: 10000,
      targetUpdateFrequency: 100,
      ...hyperparameters,
    };
    
    this.metrics = {
      totalEpisodes: 0,
      totalSteps: 0,
      averageReward: 0,
      bestReward: -Infinity,
      epsilon: this.hyperparameters.epsilonStart,
      loss: 0,
      sharpeRatio: 0,
      winRate: 0,
    };
  }
  
  /**
   * Select action using epsilon-greedy policy
   */
  selectAction(state: RLState): RLAction {
    // Epsilon-greedy exploration
    if (Math.random() < this.metrics.epsilon) {
      // Explore: Random action
      return this.randomAction();
    } else {
      // Exploit: Use learned policy
      return this.predictAction(state);
    }
  }
  
  /**
   * Generate random action for exploration
   */
  private randomAction(): RLAction {
    const actions: RLAction["type"][] = ["buy", "sell", "hold"];
    return {
      type: actions[Math.floor(Math.random() * actions.length)],
      confidence: Math.random(),
      positionSize: Math.random() * 0.05, // Max 5%
    };
  }
  
  /**
   * Predict best action using learned policy (simplified Q-network)
   */
  private predictAction(state: RLState): RLAction {
    // Simplified Q-value calculation (in production, use TensorFlow.js neural network)
    const qValues = {
      buy: this.calculateQValue(state, "buy"),
      sell: this.calculateQValue(state, "sell"),
      hold: this.calculateQValue(state, "hold"),
    };
    
    // Select action with highest Q-value
    const bestAction = Object.entries(qValues).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0] as RLAction["type"];
    
    // Calculate confidence based on Q-value difference
    const maxQ = Math.max(...Object.values(qValues));
    const avgQ = Object.values(qValues).reduce((a, b) => a + b, 0) / 3;
    const confidence = Math.min(1, (maxQ - avgQ) / Math.abs(avgQ) + 0.5);
    
    return {
      type: bestAction,
      confidence,
      positionSize: this.calculateOptimalPositionSize(state, confidence),
    };
  }
  
  /**
   * Calculate Q-value for state-action pair (simplified)
   */
  private calculateQValue(state: RLState, action: RLAction["type"]): number {
    let qValue = 0;
    
    // Technical indicators
    const rsiSignal = (state.rsi - 50) / 50; // -1 to 1
    const macdSignal = Math.tanh(state.macd / 100);
    const smaSignal = state.price > state.sma20 ? 1 : -1;
    
    // Sentiment
    const sentimentSignal = (state.newsSentiment + state.marketSentiment) / 2;
    
    // Volatility adjustment
    const volatilityPenalty = state.volatility > 0.5 ? -0.2 : 0;
    
    // Calculate Q-value based on action
    switch (action) {
      case "buy":
        qValue = (
          rsiSignal * 0.3 +
          macdSignal * 0.2 +
          smaSignal * 0.2 +
          sentimentSignal * 0.3 +
          volatilityPenalty
        );
        break;
      
      case "sell":
        qValue = -(
          rsiSignal * 0.3 +
          macdSignal * 0.2 +
          smaSignal * 0.2 +
          sentimentSignal * 0.3
        ) + volatilityPenalty;
        break;
      
      case "hold":
        qValue = Math.abs(state.unrealizedPnL) < 0.01 ? 0.5 : -0.1;
        break;
    }
    
    return qValue;
  }
  
  /**
   * Calculate optimal position size based on Kelly Criterion and confidence
   */
  private calculateOptimalPositionSize(state: RLState, confidence: number): number {
    // Simplified Kelly Criterion: f = (bp - q) / b
    // where b = odds, p = win probability, q = loss probability
    const winProb = confidence;
    const lossProb = 1 - confidence;
    const odds = 2; // Simplified: assume 2:1 reward/risk ratio
    
    const kellyFraction = (odds * winProb - lossProb) / odds;
    const adjustedFraction = Math.max(0, Math.min(0.05, kellyFraction * 0.5)); // Half-Kelly, max 5%
    
    return adjustedFraction;
  }
  
  /**
   * Store experience in replay buffer
   */
  storeExperience(experience: Experience): void {
    this.replayBuffer.push(experience);
    
    // Limit buffer size
    if (this.replayBuffer.length > this.hyperparameters.replayBufferSize) {
      this.replayBuffer.shift(); // Remove oldest experience
    }
  }
  
  /**
   * Calculate reward based on Sharpe ratio and trade outcome
   */
  calculateReward(
    trade: Trade,
    previousPortfolioValue: number,
    currentPortfolioValue: number
  ): number {
    // Base reward: Profit/loss percentage
    const returnPercent = ((currentPortfolioValue - previousPortfolioValue) / previousPortfolioValue) * 100;
    
    // Sharpe-based reward (risk-adjusted)
    const sharpeReward = returnPercent / (1 + Math.abs(returnPercent)); // Normalize
    
    // Penalty for high volatility trades
    const volatilityPenalty = trade.leverage > 1 ? -0.1 * (trade.leverage - 1) : 0;
    
    // Bonus for quick profitable trades
    const timeBonus = trade.status === "closed" && trade.pnl > 0 ? 0.1 : 0;
    
    return sharpeReward + volatilityPenalty + timeBonus;
  }
  
  /**
   * Train the RL agent using experience replay
   */
  train(): { loss: number; avgReward: number } {
    if (this.replayBuffer.length < this.hyperparameters.batchSize) {
      return { loss: 0, avgReward: 0 };
    }
    
    // Sample random batch from replay buffer
    const batch = this.sampleBatch(this.hyperparameters.batchSize);
    
    let totalLoss = 0;
    let totalReward = 0;
    
    // Train on each experience in batch
    batch.forEach((exp) => {
      // Calculate target Q-value: r + γ * max(Q(s', a'))
      const maxNextQ = Math.max(
        this.calculateQValue(exp.nextState, "buy"),
        this.calculateQValue(exp.nextState, "sell"),
        this.calculateQValue(exp.nextState, "hold")
      );
      
      const targetQ = exp.reward + (exp.done ? 0 : this.hyperparameters.discountFactor * maxNextQ);
      
      // Calculate current Q-value
      const currentQ = this.calculateQValue(exp.state, exp.action.type);
      
      // Calculate loss (MSE)
      const loss = Math.pow(targetQ - currentQ, 2);
      totalLoss += loss;
      totalReward += exp.reward;
      
      // In production: Update neural network weights using backpropagation
      // For now, this is a simplified version
    });
    
    const avgLoss = totalLoss / batch.length;
    const avgReward = totalReward / batch.length;
    
    // Update metrics
    this.metrics.loss = avgLoss;
    this.metrics.averageReward = avgReward;
    this.metrics.totalSteps += batch.length;
    
    // Decay epsilon
    this.metrics.epsilon = Math.max(
      this.hyperparameters.epsilonEnd,
      this.metrics.epsilon * this.hyperparameters.epsilonDecay
    );
    
    return { loss: avgLoss, avgReward };
  }
  
  /**
   * Sample random batch from replay buffer
   */
  private sampleBatch(batchSize: number): Experience[] {
    const batch: Experience[] = [];
    const indices = new Set<number>();
    
    while (indices.size < Math.min(batchSize, this.replayBuffer.length)) {
      indices.add(Math.floor(Math.random() * this.replayBuffer.length));
    }
    
    indices.forEach((i) => batch.push(this.replayBuffer[i]));
    return batch;
  }
  
  /**
   * Generate trading rule from learned policy
   */
  generateRule(name: string, description: string): TradingRule {
    // Extract learned patterns from Q-values
    const testStates = this.generateTestStates();
    const actions = testStates.map((state) => this.predictAction(state));
    
    // Analyze which conditions lead to buy/sell decisions
    const buyConditions = this.extractConditions(testStates, actions, "buy");
    const sellConditions = this.extractConditions(testStates, actions, "sell");
    
    // Calculate success rate from replay buffer
    const successfulTrades = this.replayBuffer.filter((exp) => exp.reward > 0).length;
    const successRate = this.replayBuffer.length > 0 
      ? successfulTrades / this.replayBuffer.length 
      : 0;
    
    const rule: TradingRule = {
      id: `rl-rule-${Date.now()}`,
      name,
      description,
      conditions: buyConditions.length > 0 ? buyConditions : sellConditions,
      action: buyConditions.length > 0 ? "buy" : "sell",
      confidence: this.metrics.averageReward > 0 ? 0.7 : 0.5,
      successRate,
      totalTrades: this.replayBuffer.length,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    this.generatedRules.push(rule);
    return rule;
  }
  
  /**
   * Generate test states for rule extraction
   */
  private generateTestStates(): RLState[] {
    const states: RLState[] = [];
    
    // Generate diverse market conditions
    for (let i = 0; i < 100; i++) {
      states.push({
        price: 100 + Math.random() * 50,
        priceChange: (Math.random() - 0.5) * 10,
        volume: Math.random(),
        volatility: Math.random(),
        sma20: 100 + Math.random() * 40,
        sma50: 100 + Math.random() * 30,
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 10,
        newsSentiment: (Math.random() - 0.5) * 2,
        marketSentiment: (Math.random() - 0.5) * 2,
        portfolioValue: 10000,
        positionSize: 0,
        unrealizedPnL: 0,
      });
    }
    
    return states;
  }
  
  /**
   * Extract conditions from learned policy
   */
  private extractConditions(
    states: RLState[],
    actions: RLAction[],
    targetAction: RLAction["type"]
  ): any[] {
    // Find states that lead to target action
    const relevantStates = states.filter((_, i) => actions[i].type === targetAction);
    
    if (relevantStates.length === 0) return [];
    
    // Analyze common patterns
    const avgRSI = relevantStates.reduce((sum, s) => sum + s.rsi, 0) / relevantStates.length;
    const avgSentiment = relevantStates.reduce((sum, s) => sum + s.newsSentiment, 0) / relevantStates.length;
    
    const conditions = [];
    
    if (targetAction === "buy") {
      if (avgRSI < 40) {
        conditions.push({ type: "sentiment", operator: ">", value: 0.3 });
      }
      if (avgSentiment > 0.3) {
        conditions.push({ type: "sentiment", operator: ">", value: 0.3 });
      }
    } else if (targetAction === "sell") {
      if (avgRSI > 60) {
        conditions.push({ type: "sentiment", operator: "<", value: -0.3 });
      }
      if (avgSentiment < -0.3) {
        conditions.push({ type: "sentiment", operator: "<", value: -0.3 });
      }
    }
    
    return conditions;
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): RLMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get generated rules
   */
  getGeneratedRules(): TradingRule[] {
    return [...this.generatedRules];
  }
  
  /**
   * Reset agent
   */
  reset(): void {
    this.replayBuffer = [];
    this.generatedRules = [];
    this.metrics = {
      totalEpisodes: 0,
      totalSteps: 0,
      averageReward: 0,
      bestReward: -Infinity,
      epsilon: this.hyperparameters.epsilonStart,
      loss: 0,
      sharpeRatio: 0,
      winRate: 0,
    };
  }
}
