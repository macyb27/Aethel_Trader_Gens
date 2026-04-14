/**
 * Alpaca API Service
 * 
 * Provides real-time market data and paper/live trading capabilities
 * Documentation: https://alpaca.markets/docs/api-references/trading-api/
 */

import axios, { AxiosInstance } from "axios";

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || "";
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET || "";
// Ensure base URL includes /v2 path
const baseUrl = process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets";
const ALPACA_BASE_URL = baseUrl.endsWith("/v2") ? baseUrl : `${baseUrl}/v2`;

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  portfolio_value: string;
  buying_power: string;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  daytrade_count: number;
  daytrading_buying_power: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  avg_entry_price: string;
  side: "long" | "short";
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  side: "buy" | "sell";
  time_in_force: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
  limit_price?: string;
  stop_price?: string;
  status: "new" | "partially_filled" | "filled" | "done_for_day" | "canceled" | "expired" | "replaced" | "pending_cancel" | "pending_replace" | "accepted" | "pending_new" | "accepted_for_bidding" | "stopped" | "rejected" | "suspended" | "calculated";
  extended_hours: boolean;
  legs?: AlpacaOrder[];
}

export interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n: number; // trade count
  vw: number; // volume weighted average price
}

export interface AlpacaQuote {
  symbol: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
  timestamp: string;
}

class AlpacaAPIService {
  private client: AxiosInstance;
  private dataClient: AxiosInstance;

  constructor() {
    // Trading API client
    this.client = axios.create({
      baseURL: ALPACA_BASE_URL,
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
      },
    });

    // Market Data API client
    this.dataClient = axios.create({
      baseURL: "https://data.alpaca.markets/v2",
      headers: {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
      },
    });
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount> {
    const response = await this.client.get("/account");
    return response.data;
  }

  /**
   * Get all open positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await this.client.get("/positions");
    return response.data;
  }

  /**
   * Get a specific position
   */
  async getPosition(symbol: string): Promise<AlpacaPosition> {
    const response = await this.client.get(`/positions/${symbol}`);
    return response.data;
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string): Promise<AlpacaOrder> {
    const response = await this.client.delete(`/positions/${symbol}`);
    return response.data;
  }

  /**
   * Get all orders
   */
  async getOrders(status?: "open" | "closed" | "all"): Promise<AlpacaOrder[]> {
    const response = await this.client.get("/orders", {
      params: { status: status || "all", limit: 100 },
    });
    return response.data;
  }

  /**
   * Get a specific order
   */
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  /**
   * Place a new order
   */
  async placeOrder(params: {
    symbol: string;
    qty: number;
    side: "buy" | "sell";
    type: "market" | "limit" | "stop" | "stop_limit";
    time_in_force?: "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
    limit_price?: number;
    stop_price?: number;
    extended_hours?: boolean;
  }): Promise<AlpacaOrder> {
    const response = await this.client.post("/orders", {
      ...params,
      time_in_force: params.time_in_force || "gtc",
    });
    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/orders/${orderId}`);
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(): Promise<void> {
    await this.client.delete("/orders");
  }

  /**
   * Get latest quote for a symbol
   */
  async getLatestQuote(symbol: string): Promise<AlpacaQuote> {
    const response = await this.dataClient.get(`/stocks/${symbol}/quotes/latest`);
    const quote = response.data.quote;
    return {
      symbol,
      bid: quote.bp,
      ask: quote.ap,
      bidSize: quote.bs,
      askSize: quote.as,
      timestamp: quote.t,
    };
  }

  /**
   * Get latest trade for a symbol
   */
  async getLatestTrade(symbol: string): Promise<{ price: number; size: number; timestamp: string }> {
    const response = await this.dataClient.get(`/stocks/${symbol}/trades/latest`);
    const trade = response.data.trade;
    return {
      price: trade.p,
      size: trade.s,
      timestamp: trade.t,
    };
  }

  /**
   * Get historical bars (OHLCV data)
   */
  async getBars(params: {
    symbol: string;
    timeframe: "1Min" | "5Min" | "15Min" | "1Hour" | "1Day";
    start?: string; // RFC3339 format
    end?: string;
    limit?: number;
  }): Promise<AlpacaBar[]> {
    const response = await this.dataClient.get(`/stocks/${params.symbol}/bars`, {
      params: {
        timeframe: params.timeframe,
        start: params.start,
        end: params.end,
        limit: params.limit || 1000,
      },
    });
    return response.data.bars || [];
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const trade = await this.getLatestTrade(symbol);
      return trade.price;
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Check if market is open
   */
  async isMarketOpen(): Promise<boolean> {
    const response = await this.client.get("/clock");
    return response.data.is_open;
  }

  /**
   * Get market calendar
   */
  async getCalendar(start?: string, end?: string): Promise<any[]> {
    const response = await this.client.get("/calendar", {
      params: { start, end },
    });
    return response.data;
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error("Alpaca API connection failed:", error);
      return false;
    }
  }
}

// Singleton instance
let alpacaInstance: AlpacaAPIService | null = null;

export function getAlpacaAPI(): AlpacaAPIService {
  if (!alpacaInstance) {
    alpacaInstance = new AlpacaAPIService();
  }
  return alpacaInstance;
}

export default AlpacaAPIService;
