/**
 * Alpaca API Service (Frontend)
 * 
 * Provides access to Alpaca Trading API via Supabase Edge Functions
 * This is a frontend wrapper that calls the secure backend
 */

import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: number;
  portfolio_value: number;
  buying_power: number;
  equity: number;
  long_market_value: number;
  short_market_value: number;
}

export interface AlpacaPosition {
  symbol: string;
  exchange: string;
  qty: number;
  avg_entry_price: number;
  side: 'long' | 'short';
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_plpc: number;
  current_price: number;
  change_today: number;
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: number;
  filled_qty: number;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  status: string;
  limit_price?: number;
  stop_price?: number;
  created_at: string;
  filled_at?: string;
}

export interface AlpacaBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
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

async function callAlpacaApi<T>(endpoint: string, method: string = 'GET', body?: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/alpaca-api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      endpoint,
      method,
      body,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Alpaca API call failed');
  }

  return response.json();
}

export async function getAlpacaAccount(): Promise<AlpacaAccount> {
  const data = await callAlpacaApi<any>('/v2/account');
  return {
    id: data.id,
    account_number: data.account_number,
    status: data.status,
    currency: data.currency,
    cash: parseFloat(data.cash),
    portfolio_value: parseFloat(data.portfolio_value),
    buying_power: parseFloat(data.buying_power),
    equity: parseFloat(data.equity),
    long_market_value: parseFloat(data.long_market_value),
    short_market_value: parseFloat(data.short_market_value),
  };
}

export async function getAlpacaPositions(): Promise<AlpacaPosition[]> {
  const data = await callAlpacaApi<any[]>('/v2/positions');
  return data.map((pos) => ({
    symbol: pos.symbol,
    exchange: pos.exchange,
    qty: parseFloat(pos.qty),
    avg_entry_price: parseFloat(pos.avg_entry_price),
    side: pos.side,
    market_value: parseFloat(pos.market_value),
    cost_basis: parseFloat(pos.cost_basis),
    unrealized_pl: parseFloat(pos.unrealized_pl),
    unrealized_plpc: parseFloat(pos.unrealized_plpc),
    current_price: parseFloat(pos.current_price),
    change_today: parseFloat(pos.change_today),
  }));
}

export async function getAlpacaOrders(status?: string): Promise<AlpacaOrder[]> {
  const params = status ? `?status=${status}` : '';
  const data = await callAlpacaApi<any[]>(`/v2/orders${params}`);
  return data.map((order) => ({
    id: order.id,
    symbol: order.symbol,
    qty: parseFloat(order.qty),
    filled_qty: parseFloat(order.filled_qty),
    type: order.type,
    side: order.side,
    status: order.status,
    limit_price: order.limit_price ? parseFloat(order.limit_price) : undefined,
    stop_price: order.stop_price ? parseFloat(order.stop_price) : undefined,
    created_at: order.created_at,
    filled_at: order.filled_at,
  }));
}

export async function placeAlpacaOrder(params: {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force?: string;
  limit_price?: number;
  stop_price?: number;
}): Promise<AlpacaOrder> {
  const data = await callAlpacaApi<any>('/v2/orders', 'POST', {
    ...params,
    time_in_force: params.time_in_force || 'gtc',
  });
  return {
    id: data.id,
    symbol: data.symbol,
    qty: parseFloat(data.qty),
    filled_qty: parseFloat(data.filled_qty || '0'),
    type: data.type,
    side: data.side,
    status: data.status,
    limit_price: data.limit_price ? parseFloat(data.limit_price) : undefined,
    stop_price: data.stop_price ? parseFloat(data.stop_price) : undefined,
    created_at: data.created_at,
    filled_at: data.filled_at,
  };
}

export async function cancelAlpacaOrder(orderId: string): Promise<void> {
  await callAlpacaApi(`/v2/orders/${orderId}`, 'DELETE');
}

export async function getAlpacaLatestPrice(symbol: string): Promise<number> {
  const data = await callAlpacaApi<any>(`/v2/stocks/${symbol}/trades/latest`);
  return data.trade?.p || 0;
}

export async function getAlpacaBars(params: {
  symbol: string;
  timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';
  start?: string;
  end?: string;
  limit?: number;
}): Promise<AlpacaBar[]> {
  const queryParams = new URLSearchParams({
    timeframe: params.timeframe,
    ...(params.start && { start: params.start }),
    ...(params.end && { end: params.end }),
    ...(params.limit && { limit: params.limit.toString() }),
  });
  
  const data = await callAlpacaApi<any>(`/v2/stocks/${params.symbol}/bars?${queryParams.toString()}`);
  return (data.bars || []).map((bar: any) => ({
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
    vwap: bar.vw,
  }));
}

export async function isAlpacaMarketOpen(): Promise<boolean> {
  const data = await callAlpacaApi<any>('/v2/clock');
  return data.is_open;
}
