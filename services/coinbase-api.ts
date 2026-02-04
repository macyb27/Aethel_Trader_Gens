/**
 * Coinbase Advanced Trade API Service
 * 
 * Provides real-time market data and trading capabilities
 * Documentation: https://docs.cloud.coinbase.com/advanced-trade-api/docs
 */

import axios, { AxiosInstance } from "axios";
import crypto from "crypto";

const COINBASE_API_KEY = process.env.COINBASE_API_KEY || "";
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET || "";
const COINBASE_BASE_URL = "https://api.coinbase.com/api/v3/brokerage";

export interface CoinbaseAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: string;
  ready: boolean;
  hold: {
    value: string;
    currency: string;
  };
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
  watched: boolean;
  is_disabled: boolean;
  new: boolean;
  status: string;
  cancel_only: boolean;
  limit_only: boolean;
  post_only: boolean;
  trading_disabled: boolean;
  auction_mode: boolean;
  product_type: string;
}

export interface CoinbaseOrder {
  order_id: string;
  product_id: string;
  user_id: string;
  order_configuration: any;
  side: "BUY" | "SELL";
  client_order_id: string;
  status: "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED" | "FAILED";
  time_in_force: string;
  created_time: string;
  completion_percentage: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
  number_of_fills: string;
  filled_value: string;
  pending_cancel: boolean;
  size_in_quote: boolean;
  total_fees: string;
  size_inclusive_of_fees: boolean;
  total_value_after_fees: string;
  trigger_status: string;
  order_type: string;
  reject_reason: string;
  settled: boolean;
  product_type: string;
  reject_message: string;
  cancel_message: string;
}

export interface CoinbaseCandle {
  start: string;
  low: string;
  high: string;
  open: string;
  close: string;
  volume: string;
}

class CoinbaseAPIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: COINBASE_BASE_URL,
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = config.method?.toUpperCase() || "GET";
      const path = config.url?.replace(COINBASE_BASE_URL, "") || "";
      const body = config.data ? JSON.stringify(config.data) : "";

      const message = `${timestamp}${method}${path}${body}`;
      const signature = crypto
        .createHmac("sha256", COINBASE_API_SECRET)
        .update(message)
        .digest("hex");

      config.headers["CB-ACCESS-KEY"] = COINBASE_API_KEY;
      config.headers["CB-ACCESS-SIGN"] = signature;
      config.headers["CB-ACCESS-TIMESTAMP"] = timestamp;
      config.headers["Content-Type"] = "application/json";

      return config;
    });
  }

  /**
   * Get all accounts
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const response = await this.client.get("/accounts");
    return response.data.accounts || [];
  }

  /**
   * Get a specific account
   */
  async getAccount(accountId: string): Promise<CoinbaseAccount> {
    const response = await this.client.get(`/accounts/${accountId}`);
    return response.data.account;
  }

  /**
   * List products
   */
  async listProducts(): Promise<CoinbaseProduct[]> {
    const response = await this.client.get("/products");
    return response.data.products || [];
  }

  /**
   * Get a specific product
   */
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    const response = await this.client.get(`/products/${productId}`);
    return response.data;
  }

  /**
   * Get product candles (OHLCV data)
   */
  async getProductCandles(params: {
    productId: string;
    start: string; // Unix timestamp
    end: string;
    granularity: "ONE_MINUTE" | "FIVE_MINUTE" | "FIFTEEN_MINUTE" | "THIRTY_MINUTE" | "ONE_HOUR" | "TWO_HOUR" | "SIX_HOUR" | "ONE_DAY";
  }): Promise<CoinbaseCandle[]> {
    const response = await this.client.get(`/products/${params.productId}/candles`, {
      params: {
        start: params.start,
        end: params.end,
        granularity: params.granularity,
      },
    });
    return response.data.candles || [];
  }

  /**
   * Create a market order
   */
  async createMarketOrder(params: {
    productId: string;
    side: "BUY" | "SELL";
    quoteSize?: string; // For buying
    baseSize?: string;  // For selling
    clientOrderId?: string;
  }): Promise<CoinbaseOrder> {
    const orderConfiguration: any = {
      market_market_ioc: {},
    };

    if (params.side === "BUY" && params.quoteSize) {
      orderConfiguration.market_market_ioc.quote_size = params.quoteSize;
    } else if (params.side === "SELL" && params.baseSize) {
      orderConfiguration.market_market_ioc.base_size = params.baseSize;
    }

    const response = await this.client.post("/orders", {
      client_order_id: params.clientOrderId || `order_${Date.now()}`,
      product_id: params.productId,
      side: params.side,
      order_configuration: orderConfiguration,
    });

    return response.data;
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(params: {
    productId: string;
    side: "BUY" | "SELL";
    baseSize: string;
    limitPrice: string;
    postOnly?: boolean;
    clientOrderId?: string;
  }): Promise<CoinbaseOrder> {
    const response = await this.client.post("/orders", {
      client_order_id: params.clientOrderId || `order_${Date.now()}`,
      product_id: params.productId,
      side: params.side,
      order_configuration: {
        limit_limit_gtc: {
          base_size: params.baseSize,
          limit_price: params.limitPrice,
          post_only: params.postOnly || false,
        },
      },
    });

    return response.data;
  }

  /**
   * Cancel orders
   */
  async cancelOrders(orderIds: string[]): Promise<any> {
    const response = await this.client.post("/orders/batch_cancel", {
      order_ids: orderIds,
    });
    return response.data;
  }

  /**
   * List orders
   */
  async listOrders(params?: {
    productId?: string;
    orderStatus?: string[];
    limit?: number;
  }): Promise<CoinbaseOrder[]> {
    const response = await this.client.get("/orders/historical/batch", {
      params: {
        product_id: params?.productId,
        order_status: params?.orderStatus?.join(","),
        limit: params?.limit || 100,
      },
    });
    return response.data.orders || [];
  }

  /**
   * Get an order
   */
  async getOrder(orderId: string): Promise<CoinbaseOrder> {
    const response = await this.client.get(`/orders/historical/${orderId}`);
    return response.data.order;
  }

  /**
   * Get current price for a product
   */
  async getCurrentPrice(productId: string): Promise<number> {
    try {
      const product = await this.getProduct(productId);
      return parseFloat(product.price);
    } catch (error) {
      console.error(`Failed to get price for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio breakdown
   */
  async getPortfolioBreakdown(): Promise<any> {
    const accounts = await this.getAccounts();
    
    const breakdown = accounts.map(account => ({
      currency: account.currency,
      available: parseFloat(account.available_balance.value),
      hold: parseFloat(account.hold.value),
      total: parseFloat(account.available_balance.value) + parseFloat(account.hold.value),
    })).filter(acc => acc.total > 0);

    return {
      accounts: breakdown,
      totalValueUSD: 0, // Calculate based on current prices
    };
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
