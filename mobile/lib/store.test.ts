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
  },
}));

import {
  loadState,
  saveState,
  completeTask,
  requestPayout,
  resetToInitialState,
  type AppState,
  type Task,
  type UserData,
} from "./store";

describe("Store Functions", () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  describe("loadState", () => {
    it("should return initial state when no data is stored", async () => {
      const state = await loadState();
      
      expect(state).toBeDefined();
      expect(state.user).toBeDefined();
      expect(state.tasks).toBeDefined();
      expect(state.affiliates).toBeDefined();
      expect(state.transactions).toBeDefined();
      expect(Array.isArray(state.tasks)).toBe(true);
      expect(state.tasks.length).toBeGreaterThan(0);
    });

    it("should return stored state when data exists", async () => {
      const testState: AppState = {
        user: {
          balance: 100,
          totalEarned: 200,
          totalPaidOut: 100,
          pendingPayouts: 0,
          name: "Test User",
          email: "test@example.com",
        },
        tasks: [],
        affiliates: [],
        transactions: [],
      };
      
      mockStorage["easygeld_app_state"] = JSON.stringify(testState);
      
      const state = await loadState();
      expect(state.user.balance).toBe(100);
      expect(state.user.name).toBe("Test User");
    });
  });

  describe("saveState", () => {
    it("should save state to storage", async () => {
      const testState: AppState = {
        user: {
          balance: 50,
          totalEarned: 50,
          totalPaidOut: 0,
          pendingPayouts: 0,
          name: "Save Test",
          email: "save@test.com",
        },
        tasks: [],
        affiliates: [],
        transactions: [],
      };
      
      await saveState(testState);
      
      expect(mockStorage["easygeld_app_state"]).toBeDefined();
      const parsed = JSON.parse(mockStorage["easygeld_app_state"]);
      expect(parsed.user.balance).toBe(50);
    });
  });

  describe("completeTask", () => {
    it("should complete a task and update balance", async () => {
      // Reset to initial state first
      await resetToInitialState();
      
      const state = await loadState();
      const firstTask = state.tasks[0];
      expect(firstTask.isCompleted).toBe(false);
      
      const result = await completeTask(firstTask.id);
      
      expect(result.success).toBe(true);
      expect(result.reward).toBe(firstTask.reward);
      
      const updatedState = await loadState();
      const completedTask = updatedState.tasks.find((t) => t.id === firstTask.id);
      expect(completedTask?.isCompleted).toBe(true);
    });

    it("should not complete an already completed task", async () => {
      await resetToInitialState();
      
      const state = await loadState();
      const firstTask = state.tasks[0];
      
      // Complete the task first time
      await completeTask(firstTask.id);
      
      // Try to complete again
      const result = await completeTask(firstTask.id);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("bereits");
    });

    it("should return error for non-existent task", async () => {
      const result = await completeTask("non-existent-task-id");
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("nicht gefunden");
    });
  });

  describe("requestPayout", () => {
    it("should reject non-German IBANs", async () => {
      const result = await requestPayout("FR7612345678901234567890123", 20);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("deutsche IBANs");
    });

    it("should reject invalid IBAN length", async () => {
      const result = await requestPayout("DE123", 20);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("IBAN-Länge");
    });

    it("should reject amount below minimum", async () => {
      const result = await requestPayout("DE89370400440532013000", 10);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("€20");
    });

    it("should reject amount exceeding balance", async () => {
      await resetToInitialState();
      const state = await loadState();
      
      const result = await requestPayout("DE89370400440532013000", state.user.balance + 100);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("Guthaben");
    });

    it("should process valid payout request", async () => {
      await resetToInitialState();
      const stateBefore = await loadState();
      const balanceBefore = stateBefore.user.balance;
      
      // Ensure we have enough balance
      expect(balanceBefore).toBeGreaterThanOrEqual(20);
      
      const result = await requestPayout("DE89370400440532013000", 20);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain("beantragt");
      
      const stateAfter = await loadState();
      expect(stateAfter.user.balance).toBe(balanceBefore - 20);
      expect(stateAfter.user.totalPaidOut).toBe(stateBefore.user.totalPaidOut + 20);
    });
  });

  describe("resetToInitialState", () => {
    it("should reset all data to initial values", async () => {
      // Clear storage first to ensure clean state
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      
      // Load initial state and modify it
      let state = await loadState();
      const initialBalance = state.user.balance;
      state.user.balance = 999;
      await saveState(state);
      
      // Verify modification
      const modifiedState = await loadState();
      expect(modifiedState.user.balance).toBe(999);
      
      // Reset
      await resetToInitialState();
      
      const resetState = await loadState();
      expect(resetState.user.balance).toBe(initialBalance); // Should be back to initial
      expect(resetState.tasks.every((t) => !t.isCompleted)).toBe(true);
    });
  });
});
