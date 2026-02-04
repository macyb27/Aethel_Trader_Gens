import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type ApiKeyProvider = 
  | 'BYBIT' 
  | 'BINANCE' 
  | 'COINBASE'
  | 'ALPACA'
  | 'FINNHUB'
  | 'OPENAI' 
  | 'DEEPSEEK' 
  | 'NEWS_API' 
  | 'ALPHA_VANTAGE';

export interface ApiKey {
  id: string;
  provider: ApiKeyProvider;
  keyName: string;
  isTestnet: boolean;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface UserSettings {
  theme: string;
  defaultExchange: string;
  riskTolerance: number;
  autoTrade: boolean;
  notificationsEnabled: boolean;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    theme: data.theme || 'dark',
    defaultExchange: data.default_exchange || 'BYBIT',
    riskTolerance: data.risk_tolerance || 0.5,
    autoTrade: data.auto_trade || false,
    notificationsEnabled: data.notifications_enabled || true,
  };
}

export async function upsertUserSettings(userId: string, settings: Partial<UserSettings>) {
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      id: userId,
      theme: settings.theme,
      default_exchange: settings.defaultExchange,
      risk_tolerance: settings.riskTolerance,
      auto_trade: settings.autoTrade,
      notifications_enabled: settings.notificationsEnabled,
    });

  return { error };
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, provider, key_name, is_testnet, is_active, last_used_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((key) => ({
    id: key.id,
    provider: key.provider as ApiKeyProvider,
    keyName: key.key_name,
    isTestnet: key.is_testnet || false,
    isActive: key.is_active || true,
    lastUsedAt: key.last_used_at,
    createdAt: key.created_at,
  }));
}

export async function addApiKey(
  userId: string,
  provider: ApiKeyProvider,
  keyName: string,
  apiKey: string,
  apiSecret: string | null,
  isTestnet: boolean
): Promise<{ data: { id: string } | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      provider,
      key_name: keyName,
      api_key_encrypted: apiKey,
      api_secret_encrypted: apiSecret,
      is_testnet: isTestnet,
      is_active: true,
    } as any)
    .select('id')
    .single();

  return { data: data as { id: string } | null, error: error as Error | null };
}

export async function deleteApiKey(keyId: string) {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId);

  return { error };
}

export async function toggleApiKey(keyId: string, isActive: boolean) {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: isActive })
    .eq('id', keyId);

  return { error };
}

export async function saveStrategy(userId: string, strategy: {
  genomeId: string;
  genomeString: string;
  generation: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  riskLevel: number;
  timeHorizon: number;
  trendBias: number;
  volatilityAffinity: number;
  entanglementScore: number;
  isActive: boolean;
}) {
  const { data, error } = await supabase
    .from('strategies')
    .upsert({
      user_id: userId,
      genome_id: strategy.genomeId,
      genome_string: strategy.genomeString,
      generation: strategy.generation,
      sharpe_ratio: strategy.sharpeRatio,
      sortino_ratio: strategy.sortinoRatio,
      max_drawdown: strategy.maxDrawdown,
      win_rate: strategy.winRate,
      profit_factor: strategy.profitFactor,
      total_trades: strategy.totalTrades,
      risk_level: strategy.riskLevel,
      time_horizon: strategy.timeHorizon,
      trend_bias: strategy.trendBias,
      volatility_affinity: strategy.volatilityAffinity,
      entanglement_score: strategy.entanglementScore,
      is_active: strategy.isActive,
    })
    .select('id')
    .single();

  return { data, error };
}

export async function addTradingLog(
  userId: string,
  level: string,
  source: string,
  message: string,
  data?: Record<string, unknown>
) {
  const { error } = await supabase
    .from('trading_logs')
    .insert({
      user_id: userId,
      level,
      source,
      message,
      data: data || null,
    });

  return { error };
}

export async function getTradingLogs(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from('trading_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

export type PaymentMethodType = 'BANK_ACCOUNT' | 'CRYPTO_WALLET' | 'CARD' | 'PAYMENT_PROCESSOR';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'USDT' | 'USDC' | 'BTC' | 'ETH' | 'SOL' | 'BNB';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PROFIT' | 'TRADE_LOSS' | 'FEE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: string;
  name: string;
  accountIdentifier: string;
  currency: Currency;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface WalletBalance {
  id: string;
  currency: Currency;
  balance: number;
  lockedBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalPnl: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  currency: Currency;
  amount: number;
  fee: number;
  status: TransactionStatus;
  paymentMethodId: string | null;
  paymentReference: string | null;
  description: string | null;
  createdAt: string;
  completedAt: string | null;
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((pm) => ({
    id: pm.id,
    type: pm.type as PaymentMethodType,
    provider: pm.provider,
    name: pm.name,
    accountIdentifier: pm.account_identifier,
    currency: pm.currency as Currency,
    isVerified: pm.is_verified,
    isActive: pm.is_active,
    createdAt: pm.created_at,
  }));
}

export async function addPaymentMethod(
  userId: string,
  type: PaymentMethodType,
  provider: string,
  name: string,
  accountIdentifier: string,
  currency: Currency
) {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: userId,
      type,
      provider,
      name,
      account_identifier: accountIdentifier,
      currency,
      is_verified: false,
      is_active: true,
    })
    .select('id')
    .single();

  return { data, error };
}

export async function deletePaymentMethod(paymentMethodId: string) {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', paymentMethodId);

  return { error };
}

export async function getWalletBalances(userId: string): Promise<WalletBalance[]> {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map((wb) => ({
    id: wb.id,
    currency: wb.currency as Currency,
    balance: parseFloat(wb.balance as string) || 0,
    lockedBalance: parseFloat(wb.locked_balance as string) || 0,
    totalDeposited: parseFloat(wb.total_deposited as string) || 0,
    totalWithdrawn: parseFloat(wb.total_withdrawn as string) || 0,
    totalPnl: parseFloat(wb.total_pnl as string) || 0,
    updatedAt: wb.updated_at,
  }));
}

export async function getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((tx) => ({
    id: tx.id,
    type: tx.type as TransactionType,
    currency: tx.currency as Currency,
    amount: parseFloat(tx.amount as string) || 0,
    fee: parseFloat(tx.fee as string) || 0,
    status: tx.status as TransactionStatus,
    paymentMethodId: tx.payment_method_id,
    paymentReference: tx.payment_reference,
    description: tx.description,
    createdAt: tx.created_at,
    completedAt: tx.completed_at,
  }));
}

export async function createTransaction(
  userId: string,
  type: TransactionType,
  currency: Currency,
  amount: number,
  paymentMethodId: string | null,
  description: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      currency,
      amount,
      fee: 0,
      status: 'PENDING',
      payment_method_id: paymentMethodId,
      description,
    })
    .select('id')
    .single();

  return { data, error };
}
