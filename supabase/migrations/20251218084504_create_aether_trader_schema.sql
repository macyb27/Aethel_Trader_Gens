/*
  # AETHER-TRADER Full-Stack Database Schema
  
  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key) - Links to auth.users
      - `theme` (text) - UI theme preference
      - `default_exchange` (text) - Preferred exchange (BYBIT, BINANCE)
      - `risk_tolerance` (numeric) - Default risk level 0-1
      - `auto_trade` (boolean) - Enable auto-trading
      - `notifications_enabled` (boolean) - Push notifications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Foreign key to auth.users
      - `provider` (text) - BYBIT, BINANCE, OPENAI, DEEPSEEK, NEWS_API
      - `key_name` (text) - User-friendly name
      - `api_key_encrypted` (text) - Encrypted API key
      - `api_secret_encrypted` (text) - Encrypted API secret (if applicable)
      - `is_active` (boolean) - Whether key is currently active
      - `last_used_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `strategies`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Foreign key to auth.users
      - `genome_id` (text) - Unique genome identifier
      - `genome_string` (text) - Encoded genome
      - `generation` (integer) - Evolution generation
      - `sharpe_ratio` (numeric) - Performance metric
      - `sortino_ratio` (numeric) - Performance metric
      - `max_drawdown` (numeric) - Maximum drawdown
      - `win_rate` (numeric) - Win rate percentage
      - `profit_factor` (numeric) - Profit factor
      - `total_trades` (integer) - Total number of trades
      - `risk_level` (numeric) - Risk parameter 0-1
      - `time_horizon` (numeric) - Time horizon parameter 0-1
      - `trend_bias` (numeric) - Trend bias parameter 0-1
      - `volatility_affinity` (numeric) - Volatility preference 0-1
      - `entanglement_score` (numeric) - Quantum entanglement score
      - `is_active` (boolean) - Currently active strategy
      - `is_favorite` (boolean) - User favorited
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `trading_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Foreign key to auth.users
      - `level` (text) - info, warn, error, success, quantum
      - `source` (text) - Log source (CORE, GA, MARKET, etc.)
      - `message` (text) - Log message
      - `data` (jsonb) - Additional structured data
      - `created_at` (timestamptz)
    
    - `market_snapshots`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Foreign key to auth.users
      - `symbol` (text) - Trading pair
      - `exchange` (text) - Exchange name
      - `price` (numeric) - Current price
      - `change_24h` (numeric) - 24h change percentage
      - `volume_24h` (numeric) - 24h volume
      - `high_24h` (numeric) - 24h high
      - `low_24h` (numeric) - 24h low
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - API keys are encrypted at rest
*/

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark',
  default_exchange text DEFAULT 'BYBIT',
  risk_tolerance numeric DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
  auto_trade boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  key_name text NOT NULL DEFAULT '',
  api_key_encrypted text NOT NULL,
  api_secret_encrypted text,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_provider CHECK (provider IN ('BYBIT', 'BINANCE', 'OPENAI', 'DEEPSEEK', 'NEWS_API', 'ALPHA_VANTAGE'))
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Strategies Table
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genome_id text NOT NULL,
  genome_string text NOT NULL,
  generation integer DEFAULT 0,
  sharpe_ratio numeric DEFAULT 0,
  sortino_ratio numeric DEFAULT 0,
  max_drawdown numeric DEFAULT 0,
  win_rate numeric DEFAULT 0,
  profit_factor numeric DEFAULT 0,
  total_trades integer DEFAULT 0,
  risk_level numeric DEFAULT 0.5 CHECK (risk_level >= 0 AND risk_level <= 1),
  time_horizon numeric DEFAULT 0.5 CHECK (time_horizon >= 0 AND time_horizon <= 1),
  trend_bias numeric DEFAULT 0.5 CHECK (trend_bias >= 0 AND trend_bias <= 1),
  volatility_affinity numeric DEFAULT 0.5 CHECK (volatility_affinity >= 0 AND volatility_affinity <= 1),
  entanglement_score numeric DEFAULT 0,
  is_active boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategies"
  ON strategies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies"
  ON strategies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON strategies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON strategies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trading Logs Table
CREATE TABLE IF NOT EXISTS trading_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  source text NOT NULL DEFAULT 'CORE',
  message text NOT NULL,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_level CHECK (level IN ('info', 'warn', 'error', 'success', 'quantum'))
);

ALTER TABLE trading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON trading_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON trading_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON trading_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Market Snapshots Table
CREATE TABLE IF NOT EXISTS market_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  exchange text NOT NULL,
  price numeric NOT NULL,
  change_24h numeric DEFAULT 0,
  volume_24h numeric DEFAULT 0,
  high_24h numeric DEFAULT 0,
  low_24h numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market snapshots"
  ON market_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market snapshots"
  ON market_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_is_active ON strategies(is_active);
CREATE INDEX IF NOT EXISTS idx_trading_logs_user_id ON trading_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_logs_created_at ON trading_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol ON market_snapshots(symbol);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_created_at ON market_snapshots(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE trading_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE market_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE strategies;