import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { actions } from '../store';
import type { RealtimeChannel } from '@supabase/supabase-js';

let logsChannel: RealtimeChannel | null = null;
let marketChannel: RealtimeChannel | null = null;
let strategiesChannel: RealtimeChannel | null = null;

export function subscribeToTradingLogs(userId: string): () => void {
  if (!isSupabaseConfigured) {
    actions.addLog('warn', 'REALTIME', 'Supabase not configured: realtime disabled');
    return () => {};
  }
  if (logsChannel) {
    logsChannel.unsubscribe();
  }

  logsChannel = supabase
    .channel(`trading_logs:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trading_logs',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const log = payload.new as {
          id: string;
          level: string;
          source: string;
          message: string;
          created_at: string;
          data?: Record<string, unknown>;
        };

        actions.addLog(
          log.level as 'info' | 'warn' | 'error' | 'success' | 'quantum',
          log.source,
          log.message,
          log.data
        );
      }
    )
    .subscribe();

  return () => {
    if (logsChannel) {
      logsChannel.unsubscribe();
      logsChannel = null;
    }
  };
}

export function subscribeToMarketSnapshots(userId: string): () => void {
  if (!isSupabaseConfigured) return () => {};
  if (marketChannel) {
    marketChannel.unsubscribe();
  }

  marketChannel = supabase
    .channel(`market_snapshots:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'market_snapshots',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const snapshot = payload.new as {
          symbol: string;
          price: number;
          change_24h: number;
          volume_24h: number;
          high_24h: number;
          low_24h: number;
          created_at: string;
        };

        actions.updateMarketData(snapshot.symbol, {
          symbol: snapshot.symbol,
          price: snapshot.price,
          change24h: snapshot.change_24h,
          volume24h: snapshot.volume_24h,
          high24h: snapshot.high_24h,
          low24h: snapshot.low_24h,
          lastUpdate: new Date(snapshot.created_at).getTime(),
        });
      }
    )
    .subscribe();

  return () => {
    if (marketChannel) {
      marketChannel.unsubscribe();
      marketChannel = null;
    }
  };
}

export function subscribeToStrategies(userId: string): () => void {
  if (!isSupabaseConfigured) return () => {};
  if (strategiesChannel) {
    strategiesChannel.unsubscribe();
  }

  strategiesChannel = supabase
    .channel(`strategies:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'strategies',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const strategy = payload.new as {
            genome_id: string;
            is_active: boolean;
            sharpe_ratio: number;
            generation: number;
          };

          if (strategy.is_active) {
            actions.addLog(
              'quantum',
              'STRATEGY',
              `Strategy ${strategy.genome_id.slice(0, 8)}... activated (Gen ${strategy.generation}, Sharpe: ${strategy.sharpe_ratio?.toFixed(2)})`
            );
          }
        }
      }
    )
    .subscribe();

  return () => {
    if (strategiesChannel) {
      strategiesChannel.unsubscribe();
      strategiesChannel = null;
    }
  };
}

export function subscribeToAllChannels(userId: string): () => void {
  const unsubLogs = subscribeToTradingLogs(userId);
  const unsubMarket = subscribeToMarketSnapshots(userId);
  const unsubStrategies = subscribeToStrategies(userId);

  return () => {
    unsubLogs();
    unsubMarket();
    unsubStrategies();
  };
}

export function unsubscribeAll(): void {
  if (logsChannel) {
    logsChannel.unsubscribe();
    logsChannel = null;
  }
  if (marketChannel) {
    marketChannel.unsubscribe();
    marketChannel = null;
  }
  if (strategiesChannel) {
    strategiesChannel.unsubscribe();
    strategiesChannel = null;
  }
}
