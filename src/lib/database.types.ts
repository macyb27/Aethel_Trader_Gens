export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Relationships: [
          {
            foreignKeyName: 'user_settings_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'strategies_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      trading_logs: {
        Row: {
          id: string;
          user_id: string;
          level: string;
          source: string;
          message: string;
          data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: string;
          source?: string;
          message: string;
          data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: string;
          source?: string;
          message?: string;
          data?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trading_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'market_snapshots_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
          is_verified: boolean | null;
          is_active: boolean | null;
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
          is_verified?: boolean | null;
          is_active?: boolean | null;
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
          is_verified?: boolean | null;
          is_active?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_methods_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      wallet_balances: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          balance: number | string;
          locked_balance: number | string;
          total_deposited: number | string;
          total_withdrawn: number | string;
          total_pnl: number | string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency: string;
          balance?: number | string;
          locked_balance?: number | string;
          total_deposited?: number | string;
          total_withdrawn?: number | string;
          total_pnl?: number | string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          balance?: number | string;
          locked_balance?: number | string;
          total_deposited?: number | string;
          total_withdrawn?: number | string;
          total_pnl?: number | string;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wallet_balances_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          currency: string;
          amount: number | string;
          fee: number | string;
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
          amount: number | string;
          fee?: number | string;
          status?: string;
          payment_method_id?: string | null;
          payment_reference?: string | null;
          description?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          currency?: string;
          amount?: number | string;
          fee?: number | string;
          status?: string;
          payment_method_id?: string | null;
          payment_reference?: string | null;
          description?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_payment_method_id_fkey';
            columns: ['payment_method_id'];
            isOneToOne: false;
            referencedRelation: 'payment_methods';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
