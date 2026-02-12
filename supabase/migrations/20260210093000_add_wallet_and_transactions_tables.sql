/*
  # Wallet + Payment Infrastructure

  Adds missing tables used by WalletPanel and supabase helpers:
  - payment_methods
  - wallet_balances
  - transactions
*/

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  account_identifier text NOT NULL,
  currency text NOT NULL,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method_type CHECK (
    type IN ('BANK_ACCOUNT', 'CRYPTO_WALLET', 'CARD', 'PAYMENT_PROCESSOR')
  ),
  CONSTRAINT valid_payment_currency CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB')
  )
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Wallet balances
CREATE TABLE IF NOT EXISTS wallet_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL,
  balance numeric DEFAULT 0,
  locked_balance numeric DEFAULT 0,
  total_deposited numeric DEFAULT 0,
  total_withdrawn numeric DEFAULT 0,
  total_pnl numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_wallet_currency CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB')
  ),
  CONSTRAINT unique_wallet_balance_per_currency UNIQUE (user_id, currency)
);

ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet balances"
  ON wallet_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet balances"
  ON wallet_balances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balances"
  ON wallet_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  fee numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  payment_reference text,
  description text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_transaction_type CHECK (
    type IN ('DEPOSIT', 'WITHDRAWAL', 'TRADE_PROFIT', 'TRADE_LOSS', 'FEE')
  ),
  CONSTRAINT valid_transaction_status CHECK (
    status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  CONSTRAINT valid_transaction_currency CHECK (
    currency IN ('USD', 'EUR', 'GBP', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB')
  )
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Keep updated_at fresh for wallet balances
DROP TRIGGER IF EXISTS update_wallet_balances_updated_at ON wallet_balances;
CREATE TRIGGER update_wallet_balances_updated_at
  BEFORE UPDATE ON wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
