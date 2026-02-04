/**
 * Kraken API Service
 * 
 * Provides real-time market data and trading capabilities
 * Documentation: https://docs.kraken.com/rest/
 */

import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import querystring from "querystring";

const KRAKEN_API_KEY = process.env.KRAKEN_API_KEY || "";
const KRAKEN_API_SECRET = process.env.KRAKEN_API_SECRET || "";
const KRAKEN_BASE_URL = "https://api.kraken.com";

export interface KrakenBalance {
  [currency: string]: string;
}

export interface KrakenTicker {
  a: string[]; // ask [price, whole lot volume, lot volume]
  b: string[]; // bid [price, whole lot volume, lot volume]
  c: string[]; // last trade closed [price, lot volume]
  v: string[]; // volume [today, last 24 hours]
  p: string[]; // volume weighted average price [today, last 24 hours]
  t: number[]; // number of trades [today, last 24 hours]
  l: string[]; // low [today, last 24 hours]
  h: string[]; // high [today, last 24 hours]
  o: string;   // today's opening price
}

export interface KrakenOrder {
  refid: string;
  userref: number;
  status: string;
  opentm: number;
  starttm: number;
  expiretm: number;
  descr: {
    pair: string;
    type: "buy" | "sell";
    ordertype: string;
    price: string;
    price2: string;
    leverage: string;
    order: string;
    close: string;
  };
  vol: string;
  vol_exec: string;
  cost: string;
  fee: string;
  price: string;
  stopprice: string;
  limitprice: string;
  misc: string;
  oflags: string;
  trades?: string[];
}

export interface KrakenOHLC {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  vwap: string;
  volume: string;
  count: number;
}

export interface KrakenTradeBalance {
  eb: string;  // equivalent balance (combined balance of all currencies)
  tb: string;  // trade balance (combined balance of all equity currencies)
  m: string;   // margin amount of open positions
  n: string;   // unrealized net profit/loss of open positions
  c: string;   // cost basis of open positions
  v: string;   // current floating valuation of open positions
  e: string;   // equity = trade balance + unrealized net profit/loss
  mf: string;  // free margin = equity - initial margin (maximum margin available to open new positions)
  ml: string;  // margin level = (equity / initial margin) * 100
}

class KrakenAPIService {
  private publicClient: AxiosInstance;
  private privateClient: AxiosInstance;
  private nonce: number;

  constructor() {
    this.nonce = Date.now();
    
    this.publicClient = axios.create({
      baseURL: `${KRAKEN_BASE_URL}/0/public`,
    });

    this.privateClient = axios.create({
      baseURL: `${KRAKEN_BASE_URL}/0/private`,
    });

    // Add request interceptor for authentication
    this.privateClient.interceptors.request.use((config) => {
      const path = config.url || "";
      const nonce = this.getNonce();
      const postData = { ...config.data, nonce };
      
      const signature = this.generateSignature(path, postData, nonce);

      config.headers["API-Key"] = KRAKEN_API_KEY;
      config.headers["API-Sign"] = signature;
      config.headers["Content-Type"] = "application/x-www-form-urlencoded";
      config.data = querystring.stringify(postData);

      return config;
    });
  }

  /**
   * Generate nonce for authentication
   */
  private getNonce(): number {
    return ++this.nonce;
  }

  /**
   * Generate API signature
   */
  private generateSignature(path: string, data: any, nonce: number): string {
    const postData = querystring.stringify(data);
    const message = nonce + postData;
    const hash = crypto.createHash("sha256").update(message).digest();
    const hmac = crypto.createHmac("sha512", Buffer.from(KRAKEN_API_SECRET, "base64"));
    const signatureBuffer = hmac.update(path + hash.toString("binary"), "binary").digest();
    return signatureBuffer.toString("base64");
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<any> {
    const response = await this.publicClient.get("/Time");
    return response.data.result;
  }

  /**
   * Get asset info
   */
  async getAssetInfo(assets?: string[]): Promise<any> {
    const response = await this.publicClient.get("/Assets", {
      params: assets ? { asset: assets.join(",") } : {},
    });
    return response.data.result;
  }

  /**
   * Get tradable asset pairs
   */
  async getAssetPairs(pairs?: string[]): Promise<any> {
    const response = await this.publicClient.get("/AssetPairs", {
      params: pairs ? { pair: pairs.join(",") } : {},
    });
    return response.data.result;
  }

  /**
   * Get ticker information
   */
  async getTicker(pairs: string[]): Promise<Record<string, KrakenTicker>> {
    const response = await this.publicClient.get("/Ticker", {
      params: { pair: pairs.join(",") },
    });
    return response.data.result;
  }

  /**
   * Get OHLC data
   */
  async getOHLC(params: {
    pair: string;
    interval?: 1 | 5 | 15 | 30 | 60 | 240 | 1440 | 10080 | 21600; // minutes
    since?: number; // Unix timestamp
  }): Promise<KrakenOHLC[]> {
    const response = await this.publicClient.get("/OHLC", {
      params: {
        pair: params.pair,
        interval: params.interval || 1,
        since: params.since,
      },
    });
    
    const result = response.data.result;
    const pairData = result[params.pair] || result[Object.keys(result)[0]];
    
    return pairData.map((candle: any[]) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      vwap: candle[5],
      volume: candle[6],
      count: candle[7],
    }));
  }

  /**
   * Get order book
   */
  async getOrderBook(pair: string, count?: number): Promise<any> {
    const response = await this.publicClient.get("/Depth", {
      params: { pair, count: count || 100 },
    });
    return response.data.result;
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(pair: string, since?: number): Promise<any> {
    const response = await this.publicClient.get("/Trades", {
      params: { pair, since },
    });
    return response.data.result;
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<KrakenBalance> {
    const response = await this.privateClient.post("/Balance");
    return response.data.result;
  }

  /**
   * Get trade balance
   */
  async getTradeBalance(asset: string = "ZUSD"): Promise<KrakenTradeBalance> {
    const response = await this.privateClient.post("/TradeBalance", { asset });
    return response.data.result;
  }

  /**
   * Get open orders
   */
  async getOpenOrders(trades?: boolean): Promise<Record<string, KrakenOrder>> {
    const response = await this.privateClient.post("/OpenOrders", { trades });
    return response.data.result.open || {};
  }

  /**
   * Get closed orders
   */
  async getClosedOrders(params?: {
    trades?: boolean;
    userref?: number;
    start?: number;
    end?: number;
    ofs?: number;
    closetime?: "open" | "close" | "both";
  }): Promise<any> {
    const response = await this.privateClient.post("/ClosedOrders", params || {});
    return response.data.result;
  }

  /**
   * Query orders info
   */
  async queryOrders(txids: string[], trades?: boolean): Promise<Record<string, KrakenOrder>> {
    const response = await this.privateClient.post("/QueryOrders", {
      txid: txids.join(","),
      trades,
    });
    return response.data.result;
  }

  /**
   * Add standard order
   */
  async addOrder(params: {
    pair: string;
    type: "buy" | "sell";
    ordertype: "market" | "limit" | "stop-loss" | "take-profit" | "stop-loss-limit" | "take-profit-limit";
    volume: string;
    price?: string;
    price2?: string;
    leverage?: string;
    oflags?: string;
    starttm?: string;
    expiretm?: string;
    userref?: string;
    validate?: boolean;
  }): Promise<any> {
    const response = await this.privateClient.post("/AddOrder", params);
    return response.data.result;
  }

  /**
   * Cancel order
   */
  async cancelOrder(txid: string): Promise<any> {
    const response = await this.privateClient.post("/CancelOrder", { txid });
    return response.data.result;
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(): Promise<any> {
    const response = await this.privateClient.post("/CancelAll");
    return response.data.result;
  }

  /**
   * Get current price for a pair
   */
  async getCurrentPrice(pair: string): Promise<number> {
    try {
      const ticker = await this.getTicker([pair]);
      const pairData = ticker[pair] || ticker[Object.keys(ticker)[0]];
      return parseFloat(pairData.c[0]);
    } catch (error) {
      console.error(`Failed to get price for ${pair}:`, error);
      throw error;
    }
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      console.error("Kraken API connection failed:", error);
      return false;
    }
  }
}

// Singleton instance
let krakenInstance: KrakenAPIService | null = null;

export function getKrakenAPI(): KrakenAPIService {
  if (!krakenInstance) {
    krakenInstance = new KrakenAPIService();
  }
  return krakenInstance;
}

export default KrakenAPIService;
