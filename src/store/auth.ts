import { createRoot } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import type { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  getUserSettings,
  upsertUserSettings,
  getApiKeys,
  type UserSettings,
  type ApiKey,
} from '../lib/supabase';
import { actions as oracleActions } from './index';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  settings: UserSettings | null;
  apiKeys: ApiKey[];
}

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  settings: null,
  apiKeys: [],
};

function createAuthStore() {
  const [state, setState] = createStore<AuthState>(initialState);

  const actions = {
    async initialize() {
      if (!isSupabaseConfigured) {
        setState({ isLoading: false, isAuthenticated: false, user: null, session: null });
        oracleActions.addLog(
          'warn',
          'AUTH',
          'Supabase is not configured. Running in DEMO mode (sign-in disabled).',
        );
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setState({
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
        await actions.loadUserData(session.user.id);
      } else {
        setState({ isLoading: false });
      }

      supabase.auth.onAuthStateChange((event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session) {
            setState({
              user: session.user,
              session,
              isAuthenticated: true,
            });
            await actions.loadUserData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setState(initialState);
            setState({ isLoading: false });
          }
        })();
      });
    },

    async loadUserData(userId: string) {
      const [settings, apiKeys] = await Promise.all([
        getUserSettings(userId),
        getApiKeys(userId),
      ]);

      setState({
        settings: settings || {
          theme: 'dark',
          defaultExchange: 'BYBIT',
          riskTolerance: 0.5,
          autoTrade: false,
          notificationsEnabled: true,
        },
        apiKeys,
      });
    },

    async signUp(email: string, password: string) {
      if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured') };
      setState({ isLoading: true });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setState({ isLoading: false });
        return { error };
      }

      if (data.user) {
        await upsertUserSettings(data.user.id, {
          theme: 'dark',
          defaultExchange: 'BYBIT',
          riskTolerance: 0.5,
          autoTrade: false,
          notificationsEnabled: true,
        });
      }

      setState({ isLoading: false });
      return { data };
    },

    async signIn(email: string, password: string) {
      if (!isSupabaseConfigured) return { data: null, error: new Error('Supabase is not configured') };
      setState({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setState({ isLoading: false });
      return { data, error };
    },

    async signOut() {
      if (!isSupabaseConfigured) return;
      await supabase.auth.signOut();
    },

    async updateSettings(settings: Partial<UserSettings>) {
      if (!state.user) return { error: new Error('Not authenticated') };

      const { error } = await upsertUserSettings(state.user.id, {
        ...state.settings,
        ...settings,
      });

      if (!error) {
        setState('settings', { ...state.settings, ...settings } as UserSettings);
      }

      return { error };
    },

    setApiKeys(apiKeys: ApiKey[]) {
      setState('apiKeys', apiKeys);
    },

    addApiKey(apiKey: ApiKey) {
      setState(produce((s) => {
        s.apiKeys.unshift(apiKey);
      }));
    },

    removeApiKey(keyId: string) {
      setState('apiKeys', state.apiKeys.filter(k => k.id !== keyId));
    },

    updateApiKey(keyId: string, updates: Partial<ApiKey>) {
      setState('apiKeys', (keys) =>
        keys.map((k) => k.id === keyId ? { ...k, ...updates } : k)
      );
    },

    hasApiKey(provider: string): boolean {
      return state.apiKeys.some(k => k.provider === provider && k.isActive);
    },

    getApiKeyForProvider(provider: string): ApiKey | undefined {
      return state.apiKeys.find(k => k.provider === provider && k.isActive);
    },
  };

  return { state, actions };
}

export const authStore = createRoot(createAuthStore);
export const { state: authState, actions: authActions } = authStore;
