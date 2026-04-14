import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      return Promise.resolve();
    }),
  },
}));

import {
  loadTradingState,
  executeTrade,
  initializePopulation,
  evolveGeneration,
  analyzeSentiment,
  addNewsItem,
  resetTradingState,
} from "./trading-store";

describe("Trading Store", () => {
  beforeEach(async () => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    // Reset to initial state
    await resetTradingState();
  });

  describe("loadTradingState", () => {
    it("should return initial state when no data exists", async () => {
      const state = await loadTradingState();
      
      expect(state).toBeDefined();
      expect(state.portfolio).toBeDefined();
      expect(state.portfolio.virtualBalance).toBe(10000);
      expect(state.portfolio.startingBalance).toBe(10000);
      expect(state.rules).toBeDefined();
      expect(state.geneticAlgorithm).toBeDefined();
    });
  });

  describe("executeTrade", () => {
    it("should execute a buy trade successfully", async () => {
      const result = await executeTrade("BTC/EUR", "buy", 0.1, 1);
      
      expect(result.success).toBe(true);
      expect(result.trade).toBeDefined();
      expect(result.trade?.side).toBe("buy");
      expect(result.trade?.symbol).toBe("BTC/EUR");
    });

    it("should reject buy trade with insufficient balance", async () => {
      const result = await executeTrade("BTC/EUR", "buy", 1000, 1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("Nicht genügend");
    });

    it("should reject sell trade without position", async () => {
      const result = await executeTrade("BTC/EUR", "sell", 0.1, 1);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("Keine offene Position");
    });
  });

  describe("analyzeSentiment", () => {
    it("should return sentiment result with score", async () => {
      const result = await analyzeSentiment("Bitcoin erreicht neues Allzeithoch");
      
      expect(result).toBeDefined();
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it("should detect positive keywords", async () => {
      const result = await analyzeSentiment("Massive Gewinne und Rallye am Markt");
      
      expect(result.score).toBeGreaterThan(0);
    });

    it("should detect negative keywords", async () => {
      const result = await analyzeSentiment("Crash und Verluste am Krypto-Markt");
      
      expect(result.score).toBeLessThan(0);
    });
  });

  describe("addNewsItem", () => {
    it("should add news item with sentiment analysis", async () => {
      const news = await addNewsItem(
        "Bitcoin steigt auf Rekordhoch",
        "Test Source",
        ["BTC"]
      );
      
      expect(news).toBeDefined();
      expect(news.headline).toBe("Bitcoin steigt auf Rekordhoch");
      expect(news.sentiment).toBeDefined();
      expect(news.source).toBe("Test Source");
    });
  });

  describe("initializePopulation", () => {
    it("should create initial population of genomes", async () => {
      await initializePopulation();
      
      const state = await loadTradingState();
      expect(state.geneticAlgorithm.population.length).toBeGreaterThan(0);
      expect(state.geneticAlgorithm.activeStrategy).toBeDefined();
    });
  });

  describe("evolveGeneration", () => {
    it("should evolve population to next generation", async () => {
      await initializePopulation();
      
      const stateBefore = await loadTradingState();
      const genBefore = stateBefore.geneticAlgorithm.generation;
      
      await evolveGeneration();
      
      const stateAfter = await loadTradingState();
      expect(stateAfter.geneticAlgorithm.generation).toBe(genBefore + 1);
    });
  });

  describe("resetTradingState", () => {
    it("should reset state to initial values", async () => {
      // First execute a trade to modify state
      await executeTrade("BTC/EUR", "buy", 0.1, 1);
      
      // Then reset
      await resetTradingState();
      
      // Verify reset - portfolio should be back to initial
      const newState = await loadTradingState();
      expect(newState.portfolio.virtualBalance).toBe(10000);
    });
  });
});
