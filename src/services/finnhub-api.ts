/**
 * Finnhub API Service (Frontend)
 * 
 * Provides access to Finnhub API via Supabase Edge Functions
 * Real-time market data, news, and sentiment analysis
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface FinnhubQuote {
  symbol: string;
  current: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface FinnhubNews {
  id: number;
  category: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
  related: string;
}

export interface FinnhubSentiment {
  symbol: string;
  bullishPercent: number;
  bearishPercent: number;
  score: number;
}

export interface FinnhubCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinnhubRecommendation {
  symbol: string;
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    'Authorization': `Bearer ${session?.access_token || anonKey}`,
    'Content-Type': 'application/json',
    'apikey': anonKey,
  };
}

async function callFinnhubApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/finnhub-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      endpoint,
      params,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Finnhub API call failed');
  }

  return response.json();
}

export async function getFinnhubQuote(symbol: string): Promise<FinnhubQuote> {
  const data = await callFinnhubApi<any>('/quote', { symbol });
  return {
    symbol,
    current: data.c,
    change: data.d,
    percentChange: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    timestamp: data.t * 1000,
  };
}

export async function getFinnhubMarketNews(category: string = 'general'): Promise<FinnhubNews[]> {
  const data = await callFinnhubApi<any[]>('/news', { category });
  return data.map((article) => ({
    id: article.id,
    category: article.category,
    headline: article.headline,
    summary: article.summary,
    source: article.source,
    url: article.url,
    image: article.image,
    datetime: article.datetime * 1000,
    related: article.related,
  }));
}

export async function getFinnhubCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubNews[]> {
  const data = await callFinnhubApi<any[]>('/company-news', { symbol, from, to });
  return data.map((article) => ({
    id: article.id,
    category: article.category,
    headline: article.headline,
    summary: article.summary,
    source: article.source,
    url: article.url,
    image: article.image,
    datetime: article.datetime * 1000,
    related: article.related,
  }));
}

export async function getFinnhubSentiment(symbol: string): Promise<FinnhubSentiment> {
  const data = await callFinnhubApi<any>('/news-sentiment', { symbol });
  const bullish = data.sentiment?.bullishPercent || 50;
  const bearish = data.sentiment?.bearishPercent || 50;
  
  return {
    symbol,
    bullishPercent: bullish,
    bearishPercent: bearish,
    score: (bullish - bearish) / 100,
  };
}

export async function getFinnhubCandles(params: {
  symbol: string;
  resolution: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';
  from: number;
  to: number;
}): Promise<FinnhubCandle[]> {
  const data = await callFinnhubApi<any>('/stock/candle', {
    symbol: params.symbol,
    resolution: params.resolution,
    from: params.from.toString(),
    to: params.to.toString(),
  });

  if (data.s !== 'ok' || !data.t) {
    return [];
  }

  return data.t.map((timestamp: number, i: number) => ({
    timestamp: timestamp * 1000,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));
}

export async function getFinnhubRecommendations(symbol: string): Promise<FinnhubRecommendation[]> {
  const data = await callFinnhubApi<any[]>('/stock/recommendation', { symbol });
  return data.map((rec) => ({
    symbol: rec.symbol,
    period: rec.period,
    strongBuy: rec.strongBuy,
    buy: rec.buy,
    hold: rec.hold,
    sell: rec.sell,
    strongSell: rec.strongSell,
  }));
}

export async function getFinnhubCompanyProfile(symbol: string): Promise<any> {
  return callFinnhubApi('/stock/profile2', { symbol });
}

export async function searchFinnhubSymbols(query: string): Promise<Array<{ symbol: string; description: string; type: string }>> {
  const data = await callFinnhubApi<any>('/search', { q: query });
  return (data.result || []).map((item: any) => ({
    symbol: item.symbol,
    description: item.description,
    type: item.type,
  }));
}

export async function getFinnhubEarningsCalendar(from: string, to: string): Promise<any[]> {
  const data = await callFinnhubApi<any>('/calendar/earnings', { from, to });
  return data.earningsCalendar || [];
}

/**
 * Get aggregated market sentiment for trading signals
 */
export async function getMarketSentimentSignal(symbols: string[]): Promise<{
  overallScore: number;
  signals: Map<string, number>;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
}> {
  const signals = new Map<string, number>();
  let totalScore = 0;

  for (const symbol of symbols) {
    try {
      const sentiment = await getFinnhubSentiment(symbol);
      signals.set(symbol, sentiment.score);
      totalScore += sentiment.score;
    } catch {
      signals.set(symbol, 0);
    }
  }

  const overallScore = symbols.length > 0 ? totalScore / symbols.length : 0;

  let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  if (overallScore > 0.5) recommendation = 'STRONG_BUY';
  else if (overallScore > 0.2) recommendation = 'BUY';
  else if (overallScore > -0.2) recommendation = 'HOLD';
  else if (overallScore > -0.5) recommendation = 'SELL';
  else recommendation = 'STRONG_SELL';

  return {
    overallScore,
    signals,
    recommendation,
  };
}
