/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - CRDT STORE (Yjs)
 * Collaborative real-time state management with conflict-free replicated data
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { actions } from '../store';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedPosition {
  id: string;
  symbol: string;
  exchange: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  leverage: number;
  marginType: 'cross' | 'isolated';
  liquidationPrice: number;
  timestamp: number;
}

export interface NormalizedOrder {
  id: string;
  clientOrderId: string;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  status: 'new' | 'filled' | 'partial' | 'canceled' | 'rejected';
  price: number;
  quantity: number;
  filledQuantity: number;
  timestamp: number;
}

export interface NormalizedTrade {
  id: string;
  orderId: string;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  fee: number;
  feeCurrency: string;
  timestamp: number;
  isMaker: boolean;
}

export interface NormalizedKline {
  timestamp: number;
  exchange: string;
  symbol: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

export interface PortfolioSnapshot {
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  marginUsed: number;
  availableBalance: number;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// YCRDT STORE MANAGER
// ─────────────────────────────────────────────────────────────────────────────

class CRDTStoreManager {
  private doc: Y.Doc;
  private persistence: IndexeddbPersistence | null = null;
  
  // Yjs shared types
  private positions: Y.Map<NormalizedPosition>;
  private orders: Y.Map<NormalizedOrder>;
  private trades: Y.Array<NormalizedTrade>;
  private klines: Y.Map<Y.Array<NormalizedKline>>;
  private portfolio: Y.Map<unknown>;
  private metadata: Y.Map<unknown>;
  
  // Observers
  private observers: Map<string, Set<(data: unknown) => void>> = new Map();
  
  constructor() {
    this.doc = new Y.Doc();
    
    // Initialize shared data structures
    this.positions = this.doc.getMap('positions');
    this.orders = this.doc.getMap('orders');
    this.trades = this.doc.getArray('trades');
    this.klines = this.doc.getMap('klines');
    this.portfolio = this.doc.getMap('portfolio');
    this.metadata = this.doc.getMap('metadata');
    
    // Set up observers
    this.setupObservers();
  }
  
  async init(): Promise<void> {
    try {
      // Enable IndexedDB persistence
      this.persistence = new IndexeddbPersistence('aether-trader-crdt', this.doc);
      
      await new Promise<void>((resolve) => {
        this.persistence!.once('synced', () => {
          actions.addLog('info', 'CRDT', 'Local persistence synced');
          resolve();
        });
      });
      
      // Initialize default values if empty
      if (!this.portfolio.has('totalValue')) {
        this.portfolio.set('totalValue', 100000); // Default $100k
        this.portfolio.set('unrealizedPnL', 0);
        this.portfolio.set('realizedPnL', 0);
        this.portfolio.set('marginUsed', 0);
        this.portfolio.set('availableBalance', 100000);
      }
      
      actions.addLog('success', 'CRDT', '✅ CRDT Store initialized');
    } catch (error) {
      actions.addLog('error', 'CRDT', `Initialization failed: ${error}`);
      throw error;
    }
  }
  
  private setupObservers(): void {
    // Position changes
    this.positions.observe((event) => {
      const positions = this.getPositions();
      this.notifyObservers('positions', positions);
      
      // Update Solid.js store
      actions.updatePortfolio({
        positions: positions.map(p => ({
          symbol: p.symbol,
          side: p.side,
          size: p.size,
          entryPrice: p.entryPrice,
          currentPrice: p.currentPrice,
          unrealizedPnL: p.unrealizedPnL,
          leverage: p.leverage,
        })),
      });
      
      // Log significant changes
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          actions.addLog('info', 'POSITION', `New position opened: ${key}`);
        } else if (change.action === 'delete') {
          actions.addLog('info', 'POSITION', `Position closed: ${key}`);
        }
      });
    });
    
    // Order changes
    this.orders.observe((event) => {
      const orders = this.getOrders();
      this.notifyObservers('orders', orders);
      
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          const order = this.orders.get(key);
          if (order) {
            actions.addLog('info', 'ORDER', `Order placed: ${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`);
          }
        }
      });
    });
    
    // Trade executions
    this.trades.observe((event) => {
      const recentTrades = this.getRecentTrades(10);
      this.notifyObservers('trades', recentTrades);
      
      event.changes.added.forEach((item) => {
        const trade = item.content.getContent()[0] as NormalizedTrade;
        if (trade) {
          actions.addLog('success', 'TRADE', 
            `Trade executed: ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ $${trade.price.toFixed(2)}`
          );
        }
      });
    });
    
    // Portfolio changes
    this.portfolio.observe(() => {
      const snapshot = this.getPortfolioSnapshot();
      this.notifyObservers('portfolio', snapshot);
      
      actions.updatePortfolio({
        totalValue: snapshot.totalValue,
        unrealizedPnL: snapshot.unrealizedPnL,
        realizedPnL: snapshot.realizedPnL,
      });
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // POSITION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  updatePosition(position: NormalizedPosition): void {
    this.doc.transact(() => {
      this.positions.set(position.id, position);
    });
  }
  
  removePosition(positionId: string): void {
    this.doc.transact(() => {
      this.positions.delete(positionId);
    });
  }
  
  getPosition(positionId: string): NormalizedPosition | undefined {
    return this.positions.get(positionId);
  }
  
  getPositions(): NormalizedPosition[] {
    const positions: NormalizedPosition[] = [];
    this.positions.forEach((value) => positions.push(value));
    return positions;
  }
  
  getPositionsByExchange(exchange: string): NormalizedPosition[] {
    return this.getPositions().filter(p => p.exchange === exchange);
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // ORDER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  
  updateOrder(order: NormalizedOrder): void {
    this.doc.transact(() => {
      this.orders.set(order.id, order);
    });
  }
  
  removeOrder(orderId: string): void {
    this.doc.transact(() => {
      this.orders.delete(orderId);
    });
  }
  
  getOrder(orderId: string): NormalizedOrder | undefined {
    return this.orders.get(orderId);
  }
  
  getOrders(): NormalizedOrder[] {
    const orders: NormalizedOrder[] = [];
    this.orders.forEach((value) => orders.push(value));
    return orders;
  }
  
  getOpenOrders(): NormalizedOrder[] {
    return this.getOrders().filter(o => o.status === 'new' || o.status === 'partial');
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // TRADE HISTORY
  // ─────────────────────────────────────────────────────────────────────────
  
  addTrade(trade: NormalizedTrade): void {
    this.doc.transact(() => {
      this.trades.push([trade]);
    });
  }
  
  getRecentTrades(limit: number = 100): NormalizedTrade[] {
    const trades = this.trades.toArray();
    return trades.slice(-limit);
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // KLINE DATA
  // ─────────────────────────────────────────────────────────────────────────
  
  addKline(symbol: string, interval: string, kline: NormalizedKline): void {
    const key = `${symbol}-${interval}`;
    
    this.doc.transact(() => {
      let klineArray = this.klines.get(key);
      if (!klineArray) {
        klineArray = new Y.Array<NormalizedKline>();
        this.klines.set(key, klineArray);
      }
      klineArray.push([kline]);
      
      // Keep only last 1000 candles to prevent memory bloat
      while (klineArray.length > 1000) {
        klineArray.delete(0);
      }
    });
  }
  
  getKlines(symbol: string, interval: string, limit: number = 200): NormalizedKline[] {
    const key = `${symbol}-${interval}`;
    const klineArray = this.klines.get(key);
    
    if (!klineArray) return [];
    
    const klines = klineArray.toArray();
    return klines.slice(-limit);
  }
  
  getLatestKline(symbol: string, interval: string): NormalizedKline | undefined {
    const klines = this.getKlines(symbol, interval, 1);
    return klines[0];
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // PORTFOLIO
  // ─────────────────────────────────────────────────────────────────────────
  
  updatePortfolio(snapshot: Partial<PortfolioSnapshot>): void {
    this.doc.transact(() => {
      Object.entries(snapshot).forEach(([key, value]) => {
        this.portfolio.set(key, value);
      });
      this.portfolio.set('timestamp', Date.now());
    });
  }
  
  getPortfolioSnapshot(): PortfolioSnapshot {
    return {
      totalValue: this.portfolio.get('totalValue') as number || 0,
      unrealizedPnL: this.portfolio.get('unrealizedPnL') as number || 0,
      realizedPnL: this.portfolio.get('realizedPnL') as number || 0,
      marginUsed: this.portfolio.get('marginUsed') as number || 0,
      availableBalance: this.portfolio.get('availableBalance') as number || 0,
      timestamp: this.portfolio.get('timestamp') as number || Date.now(),
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // OBSERVER PATTERN
  // ─────────────────────────────────────────────────────────────────────────
  
  subscribe(type: string, callback: (data: unknown) => void): () => void {
    if (!this.observers.has(type)) {
      this.observers.set(type, new Set());
    }
    this.observers.get(type)!.add(callback);
    
    return () => {
      this.observers.get(type)?.delete(callback);
    };
  }
  
  private notifyObservers(type: string, data: unknown): void {
    this.observers.get(type)?.forEach(callback => callback(data));
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────
  
  destroy(): void {
    this.persistence?.destroy();
    this.doc.destroy();
    this.observers.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const crdtStore = new CRDTStoreManager();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  crdtStore.init().catch(console.error);
}
