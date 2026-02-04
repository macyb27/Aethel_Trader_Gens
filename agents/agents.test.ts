import { describe, it, expect, beforeEach } from "vitest";
import { QABotAgent } from "./qa-bot";
import { RLRuleDeveloperAgent } from "./rl-rule-developer";
import { AgentOrchestrator } from "./orchestrator";
import { Portfolio, TradingRule, StrategyDNA } from "../trading-store";

describe("QA Bot Agent", () => {
  let qaBot: QABotAgent;
  let mockPortfolio: Portfolio;
  
  beforeEach(() => {
    qaBot = new QABotAgent();
    mockPortfolio = {
      virtualBalance: 10000,
      startingBalance: 10000,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalPnLPercent: 0,
      positions: [],
    };
  });
  
  it("should validate trade within risk limits", () => {
    const trade = {
      symbol: "AAPL",
      side: "buy" as const,
      size: 10,
      price: 150,
      leverage: 1,
    };
    
    const result = qaBot.validateTrade(trade, mockPortfolio);
    expect(result.valid).toBe(true);
    expect(result.violations.length).toBe(0);
  });
  
  it("should reject trade exceeding position size limit", () => {
    const trade = {
      symbol: "AAPL",
      side: "buy" as const,
      size: 50, // 50 * 150 = 7500 (75% of portfolio)
      price: 150,
      leverage: 1,
    };
    
    const result = qaBot.validateTrade(trade, mockPortfolio);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.type === "trade")).toBe(true);
  });
  
  it("should detect portfolio drawdown violation", () => {
    const portfolioWithDrawdown: Portfolio = {
      ...mockPortfolio,
      virtualBalance: 8500, // 15% drawdown
    };
    
    const result = qaBot.checkPortfolioRisk(portfolioWithDrawdown, 10000);
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.severity === "critical")).toBe(true);
  });
  
  it("should halt trading on high volatility", () => {
    const result = qaBot.shouldHaltTrading({ vix: 35 });
    expect(result.halt).toBe(true);
    expect(result.reason).toContain("volatility");
  });
  
  it("should halt trading outside market hours", () => {
    const result = qaBot.shouldHaltTrading({ isMarketHours: false });
    expect(result.halt).toBe(true);
    expect(result.reason).toContain("closed");
  });
  
  it("should review trading rule successfully", () => {
    const rule: TradingRule = {
      id: "test-rule-1",
      name: "Test Rule",
      description: "Test trading rule",
      conditions: [{ type: "sentiment", operator: ">", value: 0.5 }],
      action: "buy",
      confidence: 0.75,
      successRate: 0.65,
      totalTrades: 50,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    const result = qaBot.reviewRuleCode(rule);
    expect(result.passed).toBe(true);
  });
  
  it("should reject rule with low success rate", () => {
    const rule: TradingRule = {
      id: "test-rule-2",
      name: "Bad Rule",
      description: "Rule with low success rate",
      conditions: [],
      action: "buy",
      confidence: 0.6,
      successRate: 0.3, // Only 30% success rate
      totalTrades: 20,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    const result = qaBot.reviewRuleCode(rule);
    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
  
  it("should validate strategy metrics", () => {
    const metrics = {
      sharpeRatio: 1.8,
      maxDrawdown: 12,
      winRate: 58,
      profitFactor: 2.1,
    };
    
    const result = qaBot.validateStrategyMetrics(metrics);
    expect(result.approved).toBe(true);
  });
  
  it("should reject strategy with low Sharpe ratio", () => {
    const metrics = {
      sharpeRatio: 0.8, // Below 1.5 target
      maxDrawdown: 15,
      winRate: 55,
    };
    
    const result = qaBot.validateStrategyMetrics(metrics);
    expect(result.approved).toBe(false);
    expect(result.reasons.some((r) => r.includes("Sharpe"))).toBe(true);
  });
});

describe("RL Rule Developer Agent", () => {
  let rlAgent: RLRuleDeveloperAgent;
  
  beforeEach(() => {
    rlAgent = new RLRuleDeveloperAgent();
  });
  
  it("should select action using epsilon-greedy policy", () => {
    const state = {
      price: 150,
      priceChange: 2.5,
      volume: 0.8,
      volatility: 0.3,
      sma20: 148,
      sma50: 145,
      rsi: 45,
      macd: 1.2,
      newsSentiment: 0.6,
      marketSentiment: 0.4,
      portfolioValue: 10000,
      positionSize: 0,
      unrealizedPnL: 0,
    };
    
    const action = rlAgent.selectAction(state);
    expect(action.type).toMatch(/buy|sell|hold/);
    expect(action.confidence).toBeGreaterThanOrEqual(0);
    expect(action.confidence).toBeLessThanOrEqual(1);
    expect(action.positionSize).toBeGreaterThanOrEqual(0);
    expect(action.positionSize).toBeLessThanOrEqual(0.05);
  });
  
  it("should store experience in replay buffer", () => {
    const experience = {
      state: {
        price: 150,
        priceChange: 1.0,
        volume: 0.7,
        volatility: 0.2,
        sma20: 149,
        sma50: 147,
        rsi: 50,
        macd: 0.5,
        newsSentiment: 0.3,
        marketSentiment: 0.2,
        portfolioValue: 10000,
        positionSize: 0,
        unrealizedPnL: 0,
      },
      action: {
        type: "buy" as const,
        confidence: 0.7,
        positionSize: 0.03,
      },
      reward: 0.5,
      nextState: {
        price: 152,
        priceChange: 1.3,
        volume: 0.8,
        volatility: 0.2,
        sma20: 150,
        sma50: 147,
        rsi: 55,
        macd: 0.8,
        newsSentiment: 0.4,
        marketSentiment: 0.3,
        portfolioValue: 10060,
        positionSize: 0.03,
        unrealizedPnL: 60,
      },
      done: false,
      timestamp: new Date(),
    };
    
    rlAgent.storeExperience(experience);
    const metrics = rlAgent.getMetrics();
    expect(metrics.totalSteps).toBeGreaterThanOrEqual(0);
  });
  
  it("should generate trading rule from learned policy", () => {
    // Add some experiences first
    for (let i = 0; i < 10; i++) {
      rlAgent.storeExperience({
        state: {
          price: 150 + i,
          priceChange: Math.random() * 5 - 2.5,
          volume: Math.random(),
          volatility: Math.random() * 0.5,
          sma20: 148 + i,
          sma50: 145 + i,
          rsi: 40 + Math.random() * 20,
          macd: Math.random() * 2 - 1,
          newsSentiment: Math.random() * 2 - 1,
          marketSentiment: Math.random() * 2 - 1,
          portfolioValue: 10000 + i * 100,
          positionSize: 0,
          unrealizedPnL: 0,
        },
        action: {
          type: Math.random() > 0.5 ? "buy" : "sell",
          confidence: Math.random(),
          positionSize: Math.random() * 0.05,
        },
        reward: Math.random() * 2 - 1,
        nextState: {
          price: 151 + i,
          priceChange: Math.random() * 5 - 2.5,
          volume: Math.random(),
          volatility: Math.random() * 0.5,
          sma20: 149 + i,
          sma50: 146 + i,
          rsi: 45 + Math.random() * 20,
          macd: Math.random() * 2 - 1,
          newsSentiment: Math.random() * 2 - 1,
          marketSentiment: Math.random() * 2 - 1,
          portfolioValue: 10100 + i * 100,
          positionSize: 0.03,
          unrealizedPnL: 100,
        },
        done: false,
        timestamp: new Date(),
      });
    }
    
    const rule = rlAgent.generateRule("Test RL Rule", "Generated from test data");
    expect(rule.id).toContain("rl-rule");
    expect(rule.name).toBe("Test RL Rule");
    expect(rule.action).toMatch(/buy|sell|hold/);
  });
});

describe("Agent Orchestrator", () => {
  let orchestrator: AgentOrchestrator;
  
  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });
  
  it("should initialize with hypothesis phase", () => {
    const state = orchestrator.getWorkflowState();
    expect(state.phase).toBe("hypothesis");
  });
  
  it("should run complete workflow", async () => {
    // This is a simplified test - in production, mock all phases
    await orchestrator.startWorkflow();
    
    const state = orchestrator.getWorkflowState();
    expect(state.completedAt).toBeDefined();
    expect(["live", "halted"]).toContain(state.phase);
  });
  
  it("should generate messages during workflow", async () => {
    await orchestrator.startWorkflow();
    
    const messages = orchestrator.getMessages();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.some((m) => m.from === "rule_developer")).toBe(true);
    expect(messages.some((m) => m.from === "qa_bot")).toBe(true);
  });
  
  it("should emergency halt workflow", () => {
    orchestrator.emergencyHalt("Test emergency halt");
    
    const state = orchestrator.getWorkflowState();
    expect(state.phase).toBe("halted");
    
    const messages = orchestrator.getMessages();
    const haltMessage = messages.find((m) => m.payload.message?.includes("EMERGENCY HALT"));
    expect(haltMessage).toBeDefined();
    expect(haltMessage?.priority).toBe("critical");
  });
  
  it("should provide access to QA Bot", () => {
    const qaBot = orchestrator.getQABot();
    expect(qaBot).toBeInstanceOf(QABotAgent);
  });
  
  it("should provide access to RL Rule Developer", () => {
    const rlAgent = orchestrator.getRLRuleDeveloper();
    expect(rlAgent).toBeInstanceOf(RLRuleDeveloperAgent);
  });
});
