/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Configuration Manager
 * Centralized environment configuration without sandbox dependencies
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Environment type detection
export type Environment = 'development' | 'staging' | 'production';

function detectEnvironment(): Environment {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  }
  
  return 'production';
}

// Configuration interface
export interface AppConfig {
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // API endpoints
  apiBaseUrl: string;
  
  // Exchange WebSocket URLs
  exchanges: {
    bybit: {
      wsUrl: string;
      restUrl: string;
    };
    binance: {
      wsUrl: string;
      restUrl: string;
    };
    coinbase: {
      wsUrl: string;
      restUrl: string;
    };
  };
  
  // Feature flags
  features: {
    realTrading: boolean;
    aiSentiment: boolean;
    quantumEdge: boolean;
    debugMode: boolean;
  };
  
  // Limits and thresholds
  limits: {
    maxWebSocketReconnects: number;
    apiRateLimitMs: number;
    maxLogEntries: number;
    maxStrategies: number;
  };
}

// Get environment variable with optional fallback
function getEnvVar(key: string, fallback: string = ''): string {
  // Browser environment (Vite) - this is the primary use case
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string>)[key] || fallback;
  }
  
  return fallback;
}

// Build the configuration object
function buildConfig(): AppConfig {
  const environment = detectEnvironment();
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  
  return {
    environment,
    isDevelopment,
    isProduction,
    
    // Supabase configuration
    supabaseUrl: getEnvVar('VITE_SUPABASE_URL'),
    supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    
    // API configuration
    apiBaseUrl: getEnvVar('VITE_API_BASE_URL', isProduction ? '' : 'http://localhost:3000'),
    
    // Exchange configurations (production endpoints)
    exchanges: {
      bybit: {
        wsUrl: isProduction 
          ? 'wss://stream.bybit.com/v5/public/linear'
          : 'wss://stream-testnet.bybit.com/v5/public/linear',
        restUrl: isProduction
          ? 'https://api.bybit.com'
          : 'https://api-testnet.bybit.com',
      },
      binance: {
        wsUrl: isProduction
          ? 'wss://fstream.binance.com/ws'
          : 'wss://stream.binancefuture.com/ws',
        restUrl: isProduction
          ? 'https://fapi.binance.com'
          : 'https://testnet.binancefuture.com',
      },
      coinbase: {
        wsUrl: 'wss://advanced-trade-ws.coinbase.com',
        restUrl: 'https://api.coinbase.com',
      },
    },
    
    // Feature flags based on environment
    features: {
      realTrading: isProduction || getEnvVar('VITE_ENABLE_REAL_TRADING') === 'true',
      aiSentiment: getEnvVar('VITE_ENABLE_AI_SENTIMENT', 'true') === 'true',
      quantumEdge: getEnvVar('VITE_ENABLE_QUANTUM_EDGE', 'true') === 'true',
      debugMode: isDevelopment || getEnvVar('VITE_DEBUG_MODE') === 'true',
    },
    
    // Operational limits
    limits: {
      maxWebSocketReconnects: 5,
      apiRateLimitMs: 1000,
      maxLogEntries: 1000,
      maxStrategies: 100,
    },
  };
}

// Singleton configuration instance
let configInstance: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = buildConfig();
  }
  return configInstance;
}

// Reset config (useful for testing)
export function resetConfig(): void {
  configInstance = null;
}

// Validate required configuration
export function validateConfig(): { valid: boolean; errors: string[] } {
  const config = getConfig();
  const errors: string[] = [];
  
  if (!config.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!config.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export default config
export const config = getConfig();
export default config;
