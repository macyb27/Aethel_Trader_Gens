/**
 * Coinbase API Service
 * 
 * Provides access to Coinbase Advanced Trade API for trading
 * Documentation: https://docs.cloud.coinbase.com/advanced-trade-api/docs/welcome
 */

import axios, { AxiosInstance } from "axios";
import { createHmac } from "crypto";

const COINBASE_API_KEY = process.env.COINBASE_API_KEY || "";
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET || "";
const COINBASE_BASE_URL = process.env.COINBASE_BASE_URL || "https://api.coinbase.com";

export interface CoinbaseAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  hold: {
    value: string;
    currency: string;
  };
  type: string;
  ready: boolean;
}

export interface CoinbaseProduct {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  volume_percentage_change_24h: string;
  base_increment: string;
  quote_increment: string;
  quote_min_size: string;
  quote_max_size: string;
  base_min_size: string;
  base_max_size: string;
  base_name: string;
  quote_name: string;
  status: string;
  product_type: string;
}

export interface CoinbaseOrder {
  order_id: string;
  product_id: string;
  side: "BUY" | "SELL";
  client_order_id: string;
  status: "PENDING" | "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED" | "FAILED";
  time_in_force: "GTC" | "GTD" | "IOC" | "FOK";
  created_time: string;
  completion_percentage: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
  number_of_fills: string;
  filled_value: string;
  order_type: "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
  order_configuration: Record<string, unknown>;
}

export interface CoinbaseCandle {
  start: string;
  low: string;
  high: string;
  open: string;
  close: string;
  volume: string;
}

export interface CoinbaseTicker {
  product_id: string;
  price: string;
  volume_24h: string;
  low_24h: string;
  high_24h: string;
  low_52w: string;
  high_52w: string;
  price_percent_chg_24h: string;
}

class CoinbaseAPIService {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.apiKey = COINBASE_API_KEY;
    this.apiSecret = COINBASE_API_SECRET;
    
    this.client = axios.create({
      baseURL: COINBASE_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = config.method?.toUpperCase() || "GET";
      const path = config.url || "";
      const body = config.data ? JSON.stringify(config.data) : "";
      
      const signature = this.generateSignature(timestamp, method, path, body);
      
      config.headers["CB-ACCESS-KEY"] = this.apiKey;
      config.headers["CB-ACCESS-SIGN"] = signature;
      config.headers["CB-ACCESS-TIMESTAMP"] = timestamp;
      
      return config;
    });
  }

  private generateSignature(timestamp: string, method: string, path: string, body: string): string {
    const message = timestamp + method + path + body;
    return createHmac("sha256", this.apiSecret).update(message).digest("hex");
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const response = await this.client.get("/api/v3/brokerage/accounts");
    return response.data.accounts || [];
  }

  /**
   * Get a specific account
   */
  async getAccount(accountId: string): Promise<CoinbaseAccount> {
    const response = await this.client.get(`/api/v3/brokerage/accounts/${accountId}`);
    return response.data.account;
  }

  /**
   * List all products (trading pairs)
   */
  async getProducts(): Promise<CoinbaseProduct[]> {
    const response = await this.client.get("/api/v3/brokerage/products");
    return response.data.products || [];
  }

  /**
   * Get a specific product
   */
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    const response = await this.client.get(`/api/v3/brokerage/products/${productId}`);
    return response.data;
  }

  /**
   * Get ticker for a product
   */
  async getTicker(productId: string): Promise<CoinbaseTicker> {
    const response = await this.client.get(`/api/v3/brokerage/products/${productId}/ticker`);
    return response.data;
  }

  /**
   * Get candles (OHLCV data)
   */
  async getCandles(params: {
    productId: string;
    granularity: "ONE_MINUTE" | "FIVE_MINUTE" | "FIFTEEN_MINUTE" | "THIRTY_MINUTE" | "ONE_HOUR" | "TWO_HOUR" | "SIX_HOUR" | "ONE_DAY";
    start?: string;
    end?: string;
  }): Promise<CoinbaseCandle[]> {
    const response = await this.client.get(`/api/v3/brokerage/products/${params.productId}/candles`, {
      params: {
        granularity: params.granularity,
        start: params.start,
        end: params.end,
      },
    });
    return response.data.candles || [];
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(params: {
    productId: string;
    side: "BUY" | "SELL";
    size?: string;
    quoteSize?: string;
    clientOrderId?: string;
  }): Promise<CoinbaseOrder> {
    const orderConfiguration: Record<string, unknown> = {
      market_market_ioc: params.size 
        ? { base_size: params.size }
        : { quote_size: params.quoteSize },
    };

    const response = await this.client.post("/api/v3/brokerage/orders", {
      client_order_id: params.clientOrderId || `order_${Date.now()}`,
      product_id: params.productId,
      side: params.side,
      order_configuration: orderConfiguration,
    });

    return response.data.order;
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(params: {
    productId: string;
    side: "BUY" | "SELL";
    size: string;
    price: string;
    timeInForce?: "GTC" | "GTD" | "IOC" | "FOK";
    clientOrderId?: string;
  }): Promise<CoinbaseOrder> {
    const orderConfiguration = {
      limit_limit_gtc: {
        base_size: params.size,
        limit_price: params.price,
        post_only: false,
      },
    };

    const response = await this.client.post("/api/v3/brokerage/orders", {
      client_order_id: params.clientOrderId || `order_${Date.now()}`,
      product_id: params.productId,
      side: params.side,
      order_configuration: orderConfiguration,
    });

    return response.data.order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.client.post("/api/v3/brokerage/orders/batch_cancel", {
      order_ids: [orderId],
    });
  }

  /**
   * Get all orders
   */
  async getOrders(params?: {
    productId?: string;
    orderStatus?: string[];
    limit?: number;
  }): Promise<CoinbaseOrder[]> {
    const response = await this.client.get("/api/v3/brokerage/orders/historical/batch", {
      params: {
        product_id: params?.productId,
        order_status: params?.orderStatus?.join(","),
        limit: params?.limit || 100,
      },
    });
    return response.data.orders || [];
  }

  /**
   * Get a specific order
   */
  async getOrder(orderId: string): Promise<CoinbaseOrder> {
    const response = await this.client.get(`/api/v3/brokerage/orders/historical/${orderId}`);
    return response.data.order;
  }

  /**
   * Get current price for a product
   */
  async getCurrentPrice(productId: string): Promise<number> {
    const ticker = await this.getTicker(productId);
    return parseFloat(ticker.price);
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error("Coinbase API connection failed:", error);
      return false;
    }
  }

  /**
   * Get portfolio value across all accounts
   */
  async getPortfolioValue(): Promise<{ totalValue: number; accounts: Array<{ currency: string; balance: number; value: number }> }> {
    const accounts = await this.getAccounts();
    const accountDetails: Array<{ currency: string; balance: number; value: number }> = [];
    let totalValue = 0;

    for (const account of accounts) {
      const balance = parseFloat(account.available_balance.value);
      if (balance > 0) {
        let value = balance;
        
        // Convert to USD if not already
        if (account.currency !== "USD" && account.currency !== "USDT" && account.currency !== "USDC") {
          try {
            const price = await this.getCurrentPrice(`${account.currency}-USD`);
            value = balance * price;
          } catch {
            // If no USD pair exists, try USDT
            try {
              const price = await this.getCurrentPrice(`${account.currency}-USDT`);
              value = balance * price;
            } catch {
              value = 0;
            }
          }
        }

        accountDetails.push({
          currency: account.currency,
          balance,
          value,
        });
        totalValue += value;
      }
    }

    return { totalValue, accounts: accountDetails };
  }
}

// Singleton instance
let coinbaseInstance: CoinbaseAPIService | null = null;

export function getCoinbaseAPI(): CoinbaseAPIService {
  if (!coinbaseInstance) {
    coinbaseInstance = new CoinbaseAPIService();
  }
  return coinbaseInstance;
}

export default CoinbaseAPIService;
