/**
 * Finnhub API Service
 * 
 * Provides real-time market data, news, and sentiment analysis
 * Documentation: https://finnhub.io/docs/api
 */

import axios, { AxiosInstance } from "axios";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";

export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubCompanyNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubSentiment {
  symbol: string;
  sentiment: {
    bearishPercent: number;
    bullishPercent: number;
  };
  score: number; // -1 to 1
}

export interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

class FinnhubAPIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "https://finnhub.io/api/v1",
      params: {
        token: FINNHUB_API_KEY,
      },
    });
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<FinnhubQuote> {
    const response = await this.client.get("/quote", {
      params: { symbol },
    });
    return response.data;
  }

  /**
   * Get market news
   */
  async getMarketNews(category: string = "general"): Promise<FinnhubNews[]> {
    const response = await this.client.get("/news", {
      params: { category },
    });
    return response.data;
  }

  /**
   * Get company news for a specific symbol
   */
  async getCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubCompanyNews[]> {
    const response = await this.client.get("/company-news", {
      params: { symbol, from, to },
    });
    return response.data;
  }

  /**
   * Get news sentiment for a symbol
   */
  async getNewsSentiment(symbol: string): Promise<FinnhubSentiment> {
    const response = await this.client.get("/news-sentiment", {
      params: { symbol },
    });
    
    const data = response.data;
    const bullish = data.sentiment?.bullishPercent || 0;
    const bearish = data.sentiment?.bearishPercent || 0;
    
    // Calculate sentiment score (-1 to 1)
    const score = (bullish - bearish) / 100;
    
    return {
      symbol,
      sentiment: {
        bearishPercent: bearish,
        bullishPercent: bullish,
      },
      score,
    };
  }

  /**
   * Get historical candles (OHLCV data)
   */
  async getCandles(params: {
    symbol: string;
    resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";
    from: number; // Unix timestamp
    to: number;
  }): Promise<FinnhubCandle> {
    const response = await this.client.get("/stock/candle", {
      params,
    });
    return response.data;
  }

  /**
   * Get analyst recommendations
   */
  async getRecommendations(symbol: string): Promise<FinnhubRecommendation[]> {
    const response = await this.client.get("/stock/recommendation", {
      params: { symbol },
    });
    return response.data;
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol: string): Promise<any> {
    const response = await this.client.get("/stock/profile2", {
      params: { symbol },
    });
    return response.data;
  }

  /**
   * Get basic financials
   */
  async getBasicFinancials(symbol: string): Promise<any> {
    const response = await this.client.get("/stock/metric", {
      params: { symbol, metric: "all" },
    });
    return response.data;
  }

  /**
   * Search for symbols
   */
  async searchSymbols(query: string): Promise<any> {
    const response = await this.client.get("/search", {
      params: { q: query },
    });
    return response.data;
  }

  /**
   * Get economic calendar
   */
  async getEconomicCalendar(): Promise<any> {
    const response = await this.client.get("/calendar/economic");
    return response.data;
  }

  /**
   * Get earnings calendar
   */
  async getEarningsCalendar(from: string, to: string): Promise<any> {
    const response = await this.client.get("/calendar/earnings", {
      params: { from, to },
    });
    return response.data;
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getQuote("AAPL");
      return true;
    } catch (error) {
      console.error("Finnhub API connection failed:", error);
      return false;
    }
  }

  /**
   * Get aggregated sentiment for multiple symbols
   */
  async getMultiSymbolSentiment(symbols: string[]): Promise<Map<string, number>> {
    const sentimentMap = new Map<string, number>();
    
    // Batch requests with rate limiting
    for (const symbol of symbols) {
      try {
        const sentiment = await this.getNewsSentiment(symbol);
        sentimentMap.set(symbol, sentiment.score);
        
        // Rate limiting: 60 calls/minute = 1 call/second
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (error) {
        console.error(`Failed to get sentiment for ${symbol}:`, error);
        sentimentMap.set(symbol, 0);
      }
    }
    
    return sentimentMap;
  }

  /**
   * Get latest news with sentiment for trading decisions
   */
  async getLatestNewsWithSentiment(symbol: string, limit: number = 10): Promise<Array<FinnhubCompanyNews & { sentiment: number }>> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const from = weekAgo.toISOString().split("T")[0];
    const to = today.toISOString().split("T")[0];
    
    const news = await this.getCompanyNews(symbol, from, to);
    const sentiment = await this.getNewsSentiment(symbol);
    
    return news.slice(0, limit).map(item => ({
      ...item,
      sentiment: sentiment.score,
    }));
  }
}

// Singleton instance
let finnhubInstance: FinnhubAPIService | null = null;

export function getFinnhubAPI(): FinnhubAPIService {
  if (!finnhubInstance) {
    finnhubInstance = new FinnhubAPIService();
  }
  return finnhubInstance;
}

export default FinnhubAPIService;
