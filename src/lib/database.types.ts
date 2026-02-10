export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          theme: string | null;
          default_exchange: string | null;
          risk_tolerance: number | null;
          auto_trade: boolean | null;
          notifications_enabled: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          theme?: string | null;
          default_exchange?: string | null;
          risk_tolerance?: number | null;
          auto_trade?: boolean | null;
          notifications_enabled?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          theme?: string | null;
          default_exchange?: string | null;
          risk_tolerance?: number | null;
          auto_trade?: boolean | null;
          notifications_enabled?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          key_name: string;
          api_key_encrypted: string;
          api_secret_encrypted: string | null;
          is_testnet: boolean | null;
          is_active: boolean | null;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          key_name?: string;
          api_key_encrypted: string;
          api_secret_encrypted?: string | null;
          is_testnet?: boolean | null;
          is_active?: boolean | null;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          key_name?: string;
          api_key_encrypted?: string;
          api_secret_encrypted?: string | null;
          is_testnet?: boolean | null;
          is_active?: boolean | null;
          last_used_at?: string | null;
          created_at?: string;
        };
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          genome_id: string;
          genome_string: string;
          generation: number | null;
          sharpe_ratio: number | null;
          sortino_ratio: number | null;
          max_drawdown: number | null;
          win_rate: number | null;
          profit_factor: number | null;
          total_trades: number | null;
          risk_level: number | null;
          time_horizon: number | null;
          trend_bias: number | null;
          volatility_affinity: number | null;
          entanglement_score: number | null;
          is_active: boolean | null;
          is_favorite: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          genome_id: string;
          genome_string: string;
          generation?: number | null;
          sharpe_ratio?: number | null;
          sortino_ratio?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number | null;
          risk_level?: number | null;
          time_horizon?: number | null;
          trend_bias?: number | null;
          volatility_affinity?: number | null;
          entanglement_score?: number | null;
          is_active?: boolean | null;
          is_favorite?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          genome_id?: string;
          genome_string?: string;
          generation?: number | null;
          sharpe_ratio?: number | null;
          sortino_ratio?: number | null;
          max_drawdown?: number | null;
          win_rate?: number | null;
          profit_factor?: number | null;
          total_trades?: number | null;
          risk_level?: number | null;
          time_horizon?: number | null;
          trend_bias?: number | null;
          volatility_affinity?: number | null;
          entanglement_score?: number | null;
          is_active?: boolean | null;
          is_favorite?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trading_logs: {
        Row: {
          id: string;
          user_id: string;
          level: string;
          source: string;
          message: string;
          data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: string;
          source?: string;
          message: string;
          data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: string;
          source?: string;
          message?: string;
          data?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      market_snapshots: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          exchange: string;
          price: number;
          change_24h: number | null;
          volume_24h: number | null;
          high_24h: number | null;
          low_24h: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          exchange: string;
          price: number;
          change_24h?: number | null;
          volume_24h?: number | null;
          high_24h?: number | null;
          low_24h?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          exchange?: string;
          price?: number;
          change_24h?: number | null;
          volume_24h?: number | null;
          high_24h?: number | null;
          low_24h?: number | null;
          created_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          provider: string;
          name: string;
          account_identifier: string;
          currency: string;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          provider: string;
          name: string;
          account_identifier: string;
          currency: string;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          provider?: string;
          name?: string;
          account_identifier?: string;
          currency?: string;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
      };
      wallet_balances: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          balance: string;
          locked_balance: string;
          total_deposited: string;
          total_withdrawn: string;
          total_pnl: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency: string;
          balance?: string;
          locked_balance?: string;
          total_deposited?: string;
          total_withdrawn?: string;
          total_pnl?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          balance?: string;
          locked_balance?: string;
          total_deposited?: string;
          total_withdrawn?: string;
          total_pnl?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          currency: string;
          amount: string;
          fee: string;
          status: string;
          payment_method_id: string | null;
          payment_reference: string | null;
          description: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          currency: string;
          amount: number;
          fee?: number;
          status?: string;
          payment_method_id?: string | null;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          currency?: string;
          amount?: number;
          fee?: number;
          status?: string;
          payment_method_id?: string | null;
          payment_reference?: string | null;
          description?: string | null;
          completed_at?: string | null;
        };
      };
    };
  };
}
