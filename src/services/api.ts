import { supabase, isSupabaseConfigured } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) {
    return {
      'Content-Type': 'application/json',
    };
  }
  const { data: { session } } = await supabase.auth.getSession();

  return {
    'Authorization': `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
}

export type Exchange = 'BYBIT' | 'BINANCE';

export interface ExchangeApiRequest {
  exchange: Exchange;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface MarketTicker {
  symbol: string;
  lastPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  highPrice24h: number;
  lowPrice24h: number;
  volume24h: number;
  turnover24h: number;
}

export interface AccountBalance {
  coin: string;
  walletBalance: number;
  availableBalance: number;
  unrealisedPnl: number;
}

export interface Position {
  symbol: string;
  side: 'Buy' | 'Sell';
  size: number;
  avgPrice: number;
  markPrice: number;
  unrealisedPnl: number;
  leverage: number;
}

export async function callExchangeApi<T = unknown>(request: ExchangeApiRequest): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (exchange API unavailable)');
  }
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/exchange-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Exchange API call failed');
  }

  return response.json();
}

export async function getBybitTicker(symbol: string): Promise<MarketTicker> {
  const response = await callExchangeApi<{
    result: {
      list: Array<{
        symbol: string;
        lastPrice: string;
        price24hPcnt: string;
        highPrice24h: string;
        lowPrice24h: string;
        volume24h: string;
        turnover24h: string;
      }>;
    };
  }>({
    exchange: 'BYBIT',
    endpoint: '/v5/market/tickers',
    method: 'GET',
    params: { category: 'linear', symbol },
  });

  const ticker = response.result?.list?.[0];
  if (!ticker) throw new Error('Ticker not found');

  return {
    symbol: ticker.symbol,
    lastPrice: parseFloat(ticker.lastPrice),
    priceChange24h: 0,
    priceChangePercent24h: parseFloat(ticker.price24hPcnt) * 100,
    highPrice24h: parseFloat(ticker.highPrice24h),
    lowPrice24h: parseFloat(ticker.lowPrice24h),
    volume24h: parseFloat(ticker.volume24h),
    turnover24h: parseFloat(ticker.turnover24h),
  };
}

export async function getBinanceTicker(symbol: string): Promise<MarketTicker> {
  const response = await callExchangeApi<{
    symbol: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
  }>({
    exchange: 'BINANCE',
    endpoint: '/fapi/v1/ticker/24hr',
    method: 'GET',
    params: { symbol },
  });

  return {
    symbol: response.symbol,
    lastPrice: parseFloat(response.lastPrice),
    priceChange24h: parseFloat(response.priceChange),
    priceChangePercent24h: parseFloat(response.priceChangePercent),
    highPrice24h: parseFloat(response.highPrice),
    lowPrice24h: parseFloat(response.lowPrice),
    volume24h: parseFloat(response.volume),
    turnover24h: parseFloat(response.quoteVolume),
  };
}

export async function getBybitAccountBalance(): Promise<AccountBalance[]> {
  const response = await callExchangeApi<{
    result: {
      list: Array<{
        coin: Array<{
          coin: string;
          walletBalance: string;
          availableToWithdraw: string;
          unrealisedPnl: string;
        }>;
      }>;
    };
  }>({
    exchange: 'BYBIT',
    endpoint: '/v5/account/wallet-balance',
    method: 'GET',
    params: { accountType: 'UNIFIED' },
  });

  const coins = response.result?.list?.[0]?.coin || [];

  return coins.map((coin) => ({
    coin: coin.coin,
    walletBalance: parseFloat(coin.walletBalance),
    availableBalance: parseFloat(coin.availableToWithdraw),
    unrealisedPnl: parseFloat(coin.unrealisedPnl),
  }));
}

export async function getBybitPositions(): Promise<Position[]> {
  const response = await callExchangeApi<{
    result: {
      list: Array<{
        symbol: string;
        side: 'Buy' | 'Sell';
        size: string;
        avgPrice: string;
        markPrice: string;
        unrealisedPnl: string;
        leverage: string;
      }>;
    };
  }>({
    exchange: 'BYBIT',
    endpoint: '/v5/position/list',
    method: 'GET',
    params: { category: 'linear', settleCoin: 'USDT' },
  });

  return (response.result?.list || [])
    .filter((pos) => parseFloat(pos.size) !== 0)
    .map((pos) => ({
      symbol: pos.symbol,
      side: pos.side,
      size: parseFloat(pos.size),
      avgPrice: parseFloat(pos.avgPrice),
      markPrice: parseFloat(pos.markPrice),
      unrealisedPnl: parseFloat(pos.unrealisedPnl),
      leverage: parseFloat(pos.leverage),
    }));
}

export interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface SentimentResult {
  score: number;
  confidence: number;
  magnitude: number;
  keywords: string[];
  categories: string[];
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
}

export async function fetchNews(query?: string): Promise<{ articles: NewsArticle[]; fallback: boolean }> {
  if (!isSupabaseConfigured) return { articles: [], fallback: true };
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/news-sentiment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'fetch_news',
      query: query || 'cryptocurrency bitcoin ethereum',
    }),
  });

  if (!response.ok) {
    return { articles: [], fallback: true };
  }

  return response.json();
}

export async function analyzeSentiment(
  headlines: string[],
  provider?: 'OPENAI' | 'DEEPSEEK'
): Promise<{ results: SentimentResult[]; provider: string }> {
  if (!isSupabaseConfigured) {
    return {
      results: headlines.map(() => ({
        score: 0,
        confidence: 0.5,
        magnitude: 0.3,
        keywords: [],
        categories: ['GENERAL'],
        impact: 'LOW' as const,
        reasoning: 'Supabase not configured',
      })),
      provider: 'FALLBACK',
    };
  }
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/news-sentiment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'analyze_sentiment',
      headlines,
      provider,
    }),
  });

  if (!response.ok) {
    return {
      results: headlines.map(() => ({
        score: 0,
        confidence: 0.5,
        magnitude: 0.3,
        keywords: [],
        categories: ['GENERAL'],
        impact: 'LOW' as const,
        reasoning: 'API unavailable',
      })),
      provider: 'FALLBACK',
    };
  }

  return response.json();
}
