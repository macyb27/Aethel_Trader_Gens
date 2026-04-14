/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - LIVE AGENT RUNNER
 * Führt Agenten im Live-/Paper-Betrieb aus und schickt Intents durch LiveRouter
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { BaseAgent } from './baseAgent';
import type { Candle } from '../types/backtest';
import type { LiveRouter } from '../logic/liveRouter';

export interface LiveAgentRunnerOptions {
  agent: BaseAgent;
  liveRouter: LiveRouter;
  getCurrentCandle: () => Candle | null;
  getSymbol?: () => string;
}

/**
 * LiveAgentRunner: Ruft agent.decide auf und routet Intents durch liveRouter
 */
export async function runLiveAgent(
  options: LiveAgentRunnerOptions
): Promise<{ intentsSent: number; results: Array<{ success: boolean; orderId?: string }> }> {
  const { agent, liveRouter, getCurrentCandle, getSymbol } = options;
  const candle = getCurrentCandle();
  if (!candle) return { intentsSent: 0, results: [] };

  const context = {
    index: 0,
    candles: [candle],
    symbol: getSymbol?.() ?? 'BTCUSDT',
  };

  const intents = agent.decide(candle, context);
  const results: Array<{ success: boolean; orderId?: string }> = [];

  for (const intent of intents) {
    const result = await liveRouter.route(intent);
    results.push({
      success: result.success,
      orderId: result.orderId,
    });
  }

  return { intentsSent: intents.length, results };
}
