import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];
type ApiKeyRow = Database['public']['Tables']['api_keys']['Row'];
type PaymentMethodRow = Database['public']['Tables']['payment_methods']['Row'];
type WalletBalanceRow = Database['public']['Tables']['wallet_balances']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export type ApiKeyProvider = 'BYBIT' | 'BINANCE' | 'OPENAI' | 'DEEPSEEK' | 'NEWS_API' | 'ALPHA_VANTAGE';

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

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  const row = data as UserSettingsRow | null;
  if (error || !row) return null;

  return {
    theme: row.theme ?? 'dark',
    defaultExchange: row.default_exchange ?? 'BYBIT',
    riskTolerance: row.risk_tolerance ?? 0.5,
    autoTrade: row.auto_trade ?? false,
    notificationsEnabled: row.notifications_enabled ?? true,
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

  const rows = (data ?? []) as ApiKeyRow[];
  if (error || rows.length === 0) return [];

  return rows.map((key) => ({
    id: key.id,
    provider: key.provider as ApiKeyProvider,
    keyName: key.key_name,
    isTestnet: key.is_testnet ?? false,
    isActive: key.is_active ?? true,
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
) {
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
    })
    .select('id')
    .single();

  return { data, error };
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
      data: (data ?? null) as Json | null,
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

  const rows = (data ?? []) as PaymentMethodRow[];
  if (error || rows.length === 0) return [];

  return rows.map((pm) => ({
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

  const rows = (data ?? []) as WalletBalanceRow[];
  if (error || rows.length === 0) return [];

  return rows.map((wb) => ({
    id: wb.id,
    currency: wb.currency as Currency,
    balance: toNumber(wb.balance),
    lockedBalance: toNumber(wb.locked_balance),
    totalDeposited: toNumber(wb.total_deposited),
    totalWithdrawn: toNumber(wb.total_withdrawn),
    totalPnl: toNumber(wb.total_pnl),
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

  const rows = (data ?? []) as TransactionRow[];
  if (error || rows.length === 0) return [];

  return rows.map((tx) => ({
    id: tx.id,
    type: tx.type as TransactionType,
    currency: tx.currency as Currency,
    amount: toNumber(tx.amount),
    fee: toNumber(tx.fee),
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
