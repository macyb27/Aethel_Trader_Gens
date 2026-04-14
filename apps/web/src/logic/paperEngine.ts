/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - PAPER ENGINE
 * Simuliert Orders ohne echtes Geld (Paper Trading)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OrderIntent } from '../types/trading';
import type { PaperEngine as PaperEngineInterface } from './liveRouter';

export class PaperEngineImpl implements PaperEngineInterface {
  private paperOrders: Map<string, OrderIntent> = new Map();

  async executePaperOrder(intent: OrderIntent): Promise<{ success: boolean; orderId?: string }> {
    const orderId = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.paperOrders.set(orderId, intent);
    return { success: true, orderId };
  }

  getPaperOrders(): Map<string, OrderIntent> {
    return new Map(this.paperOrders);
  }

  clear(): void {
    this.paperOrders.clear();
  }
}
