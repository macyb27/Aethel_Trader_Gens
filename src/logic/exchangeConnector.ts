/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - MULTI-EXCHANGE CONNECTOR
 * Normalized WebSocket connections for Bybit & Binance
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { actions } from '../store';
import { crdtStore, NormalizedKline, NormalizedTrade } from './crdt_store';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type Exchange = 'BYBIT' | 'BINANCE';

export interface ExchangeConfig {
  name: Exchange;
  wsUrl: string;
  restUrl: string;
  reconnectDelay: number;
  heartbeatInterval: number;
}

export interface ConnectionState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastHeartbeat: number;
  latency: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────────────

const EXCHANGE_CONFIGS: Record<Exchange, ExchangeConfig> = {
  BYBIT: {
    name: 'BYBIT',
    wsUrl: 'wss://stream.bybit.com/v5/public/linear',
    restUrl: 'https://api.bybit.com',
    reconnectDelay: 5000,
    heartbeatInterval: 20000,
  },
  BINANCE: {
    name: 'BINANCE',
    wsUrl: 'wss://fstream.binance.com/ws',
    restUrl: 'https://fapi.binance.com',
    reconnectDelay: 5000,
    heartbeatInterval: 30000,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize Bybit kline data to common format
 */
function normalizeBybitKline(data: any, symbol: string, interval: string): NormalizedKline {
  return {
    timestamp: data.start || data.t || Date.now(),
    exchange: 'BYBIT',
    symbol,
    interval,
    open: parseFloat(data.open || data.o || '0'),
    high: parseFloat(data.high || data.h || '0'),
    low: parseFloat(data.low || data.l || '0'),
    close: parseFloat(data.close || data.c || '0'),
    volume: parseFloat(data.volume || data.v || '0'),
    trades: data.n || 0,
  };
}

/**
 * Normalize Binance kline data to common format
 */
function normalizeBinanceKline(data: any, symbol: string, interval: string): NormalizedKline {
  // Binance kline format: [t,o,h,l,c,v,T,q,n,V,Q,B]
  if (Array.isArray(data)) {
    return {
      timestamp: data[0],
      exchange: 'BINANCE',
      symbol,
      interval,
      open: parseFloat(data[1]),
      high: parseFloat(data[2]),
      low: parseFloat(data[3]),
      close: parseFloat(data[4]),
      volume: parseFloat(data[5]),
      trades: data[8] || 0,
    };
  }
  
  // Object format (from WebSocket)
  const k = data.k || data;
  return {
    timestamp: k.t || Date.now(),
    exchange: 'BINANCE',
    symbol: k.s || symbol,
    interval: k.i || interval,
    open: parseFloat(k.o || '0'),
    high: parseFloat(k.h || '0'),
    low: parseFloat(k.l || '0'),
    close: parseFloat(k.c || '0'),
    volume: parseFloat(k.v || '0'),
    trades: k.n || 0,
  };
}

/**
 * Normalize Bybit trade data
 */
function normalizeBybitTrade(data: any): NormalizedTrade {
  return {
    id: data.i || String(Date.now()),
    orderId: '',
    symbol: data.s || '',
    exchange: 'BYBIT',
    side: data.S?.toLowerCase() === 'sell' ? 'sell' : 'buy',
    price: parseFloat(data.p || '0'),
    quantity: parseFloat(data.v || '0'),
    fee: 0,
    feeCurrency: 'USDT',
    timestamp: data.T || Date.now(),
    isMaker: data.m || false,
  };
}

/**
 * Normalize Binance trade data
 */
function normalizeBinanceTrade(data: any): NormalizedTrade {
  return {
    id: String(data.t || Date.now()),
    orderId: '',
    symbol: data.s || '',
    exchange: 'BINANCE',
    side: data.m ? 'sell' : 'buy', // m = true means buyer is maker (seller is taker)
    price: parseFloat(data.p || '0'),
    quantity: parseFloat(data.q || '0'),
    fee: 0,
    feeCurrency: 'USDT',
    timestamp: data.T || Date.now(),
    isMaker: data.m || false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE CONNECTOR CLASS
// ─────────────────────────────────────────────────────────────────────────────

class ExchangeConnector {
  private config: ExchangeConfig;
  private ws: WebSocket | null = null;
  private state: ConnectionState = {
    isConnected: false,
    reconnectAttempts: 0,
    lastHeartbeat: 0,
    latency: 0,
  };
  private subscriptions: Set<string> = new Set();
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private messageHandlers: Map<string, (data: unknown) => void> = new Map();
  
  // Simulated mode (for demo without real WebSocket)
  private isSimulated: boolean = true;
  private simulationTimer: number | null = null;
  
  constructor(exchange: Exchange) {
    this.config = EXCHANGE_CONFIGS[exchange];
  }
  
  async connect(): Promise<void> {
    if (this.isSimulated) {
      await this.startSimulation();
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl);
        
        this.ws.onopen = () => {
          this.state.isConnected = true;
          this.state.reconnectAttempts = 0;
          this.startHeartbeat();
          
          actions.addLog('success', this.config.name, `✅ WebSocket connected`);
          
          // Resubscribe to all channels
          this.subscriptions.forEach(sub => this.sendSubscription(sub));
          
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onerror = (error) => {
          actions.addLog('error', this.config.name, `WebSocket error: ${error}`);
        };
        
        this.ws.onclose = () => {
          this.state.isConnected = false;
          this.stopHeartbeat();
          actions.addLog('warn', this.config.name, 'WebSocket disconnected');
          this.scheduleReconnect();
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private async startSimulation(): Promise<void> {
    this.state.isConnected = true;
    actions.addLog('info', this.config.name, `📡 Simulated connection active`);
    
    // Generate simulated market data
    let basePrice = 42000;
    
    this.simulationTimer = window.setInterval(() => {
      // Simulate price movement
      const change = (Math.random() - 0.5) * 100;
      basePrice += change;
      
      const kline: NormalizedKline = {
        timestamp: Date.now(),
        exchange: this.config.name,
        symbol: 'BTCUSDT',
        interval: '1m',
        open: basePrice - Math.random() * 50,
        high: basePrice + Math.random() * 50,
        low: basePrice - Math.random() * 50,
        close: basePrice,
        volume: Math.random() * 100,
        trades: Math.floor(Math.random() * 500),
      };
      
      // Update CRDT store
      crdtStore.addKline('BTCUSDT', '1m', kline);
      
      // Update market data in main store
      actions.updateMarketData('BTCUSDT', {
        symbol: 'BTCUSDT',
        price: basePrice,
        change24h: (Math.random() - 0.5) * 5,
        volume24h: Math.random() * 1000000000,
        high24h: basePrice + 500,
        low24h: basePrice - 500,
        lastUpdate: Date.now(),
      });
      
      // Notify handlers
      this.messageHandlers.forEach((handler, channel) => {
        if (channel.includes('kline')) {
          handler(kline);
        }
      });
      
      // Occasional log
      if (Math.random() > 0.9) {
        actions.addLog('info', this.config.name, 
          `BTCUSDT: $${basePrice.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)})`
        );
      }
      
    }, 1000); // Update every second
  }
  
  disconnect(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopHeartbeat();
    this.stopReconnect();
    this.state.isConnected = false;
    
    actions.addLog('info', this.config.name, 'Disconnected');
  }
  
  subscribe(channel: string, handler: (data: unknown) => void): void {
    this.subscriptions.add(channel);
    this.messageHandlers.set(channel, handler);
    
    if (this.state.isConnected && !this.isSimulated) {
      this.sendSubscription(channel);
    }
    
    actions.addLog('info', this.config.name, `Subscribed to ${channel}`);
  }
  
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    this.messageHandlers.delete(channel);
    
    if (this.state.isConnected && this.ws && !this.isSimulated) {
      this.sendUnsubscription(channel);
    }
  }
  
  private sendSubscription(channel: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    let message: object;
    
    if (this.config.name === 'BYBIT') {
      message = {
        op: 'subscribe',
        args: [channel],
      };
    } else {
      message = {
        method: 'SUBSCRIBE',
        params: [channel],
        id: Date.now(),
      };
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  private sendUnsubscription(channel: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    let message: object;
    
    if (this.config.name === 'BYBIT') {
      message = {
        op: 'unsubscribe',
        args: [channel],
      };
    } else {
      message = {
        method: 'UNSUBSCRIBE',
        params: [channel],
        id: Date.now(),
      };
    }
    
    this.ws.send(JSON.stringify(message));
  }
  
  private handleMessage(rawData: string): void {
    try {
      const data = JSON.parse(rawData);
      
      // Handle heartbeat/pong
      if (data.op === 'pong' || data.pong || data.result === null) {
        this.state.lastHeartbeat = Date.now();
        return;
      }
      
      // Route to appropriate handler
      if (this.config.name === 'BYBIT') {
        this.handleBybitMessage(data);
      } else {
        this.handleBinanceMessage(data);
      }
      
    } catch (error) {
      // Non-JSON message, ignore
    }
  }
  
  private handleBybitMessage(data: any): void {
    const topic = data.topic || '';
    
    if (topic.includes('kline')) {
      const klineData = data.data?.[0];
      if (klineData) {
        const [symbol, interval] = topic.split('.');
        const normalized = normalizeBybitKline(klineData, symbol.replace('kline.', ''), interval);
        
        crdtStore.addKline(normalized.symbol, normalized.interval, normalized);
        
        const handler = this.messageHandlers.get(topic);
        if (handler) handler(normalized);
      }
    } else if (topic.includes('trade')) {
      const tradeData = data.data?.[0];
      if (tradeData) {
        const normalized = normalizeBybitTrade(tradeData);
        crdtStore.addTrade(normalized);
        
        const handler = this.messageHandlers.get(topic);
        if (handler) handler(normalized);
      }
    }
  }
  
  private handleBinanceMessage(data: any): void {
    const eventType = data.e || '';
    
    if (eventType === 'kline') {
      const normalized = normalizeBinanceKline(data, data.s, data.k?.i);
      
      crdtStore.addKline(normalized.symbol, normalized.interval, normalized);
      
      const stream = `${data.s.toLowerCase()}@kline_${data.k?.i}`;
      const handler = this.messageHandlers.get(stream);
      if (handler) handler(normalized);
      
    } else if (eventType === 'trade' || eventType === 'aggTrade') {
      const normalized = normalizeBinanceTrade(data);
      crdtStore.addTrade(normalized);
      
      const stream = `${data.s.toLowerCase()}@trade`;
      const handler = this.messageHandlers.get(stream);
      if (handler) handler(normalized);
    }
  }
  
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        
        if (this.config.name === 'BYBIT') {
          this.ws.send(JSON.stringify({ op: 'ping' }));
        } else {
          // Binance uses native WebSocket ping/pong
        }
        
        // Calculate latency on next pong
        const checkLatency = () => {
          if (this.state.lastHeartbeat > pingTime) {
            this.state.latency = this.state.lastHeartbeat - pingTime;
          }
        };
        setTimeout(checkLatency, 1000);
      }
    }, this.config.heartbeatInterval);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= 5) {
      actions.addLog('error', this.config.name, 'Max reconnection attempts reached');
      return;
    }
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts);
    this.state.reconnectAttempts++;
    
    actions.addLog('info', this.config.name, `Reconnecting in ${delay / 1000}s...`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  getState(): ConnectionState {
    return { ...this.state };
  }
  
  isConnected(): boolean {
    return this.state.isConnected;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCHANGE MANAGER (Multi-Exchange Orchestration)
// ─────────────────────────────────────────────────────────────────────────────

class ExchangeManager {
  private connectors: Map<Exchange, ExchangeConnector> = new Map();
  
  async connectExchange(exchange: Exchange): Promise<void> {
    if (this.connectors.has(exchange)) {
      actions.addLog('warn', 'EXCHANGE', `${exchange} already connected`);
      return;
    }
    
    const connector = new ExchangeConnector(exchange);
    await connector.connect();
    this.connectors.set(exchange, connector);
  }
  
  disconnectExchange(exchange: Exchange): void {
    const connector = this.connectors.get(exchange);
    if (connector) {
      connector.disconnect();
      this.connectors.delete(exchange);
    }
  }
  
  disconnectAll(): void {
    this.connectors.forEach((connector) => connector.disconnect());
    this.connectors.clear();
  }
  
  subscribe(exchange: Exchange, channel: string, handler: (data: unknown) => void): void {
    const connector = this.connectors.get(exchange);
    if (connector) {
      connector.subscribe(channel, handler);
    } else {
      actions.addLog('error', 'EXCHANGE', `${exchange} not connected`);
    }
  }
  
  getConnector(exchange: Exchange): ExchangeConnector | undefined {
    return this.connectors.get(exchange);
  }
  
  getConnectedExchanges(): Exchange[] {
    return Array.from(this.connectors.keys());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const exchangeManager = new ExchangeManager();
