import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
