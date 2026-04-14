import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { 
  AppState, 
  loadState, 
  saveState, 
  completeTask as storeCompleteTask,
  trackAffiliateClick as storeTrackAffiliateClick,
  requestPayout as storeRequestPayout,
  resetToInitialState,
} from "./store";

interface AppContextType {
  state: AppState | null;
  loading: boolean;
  refreshState: () => Promise<void>;
  completeTask: (taskId: string) => Promise<{ success: boolean; reward: number; message: string }>;
  trackAffiliateClick: (affiliateId: string) => Promise<{ success: boolean; reward: number; message: string }>;
  requestPayout: (iban: string, amount: number) => Promise<{ success: boolean; message: string }>;
  resetData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshState = useCallback(async () => {
    setLoading(true);
    try {
      const loadedState = await loadState();
      setState(loadedState);
    } catch (error) {
      console.error("Error refreshing state:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const completeTask = useCallback(async (taskId: string) => {
    const result = await storeCompleteTask(taskId);
    if (result.success) {
      await refreshState();
    }
    return result;
  }, [refreshState]);

  const trackAffiliateClick = useCallback(async (affiliateId: string) => {
    const result = await storeTrackAffiliateClick(affiliateId);
    if (result.success) {
      await refreshState();
    }
    return result;
  }, [refreshState]);

  const requestPayout = useCallback(async (iban: string, amount: number) => {
    const result = await storeRequestPayout(iban, amount);
    if (result.success) {
      await refreshState();
    }
    return result;
  }, [refreshState]);

  const resetData = useCallback(async () => {
    await resetToInitialState();
    await refreshState();
  }, [refreshState]);

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        refreshState,
        completeTask,
        trackAffiliateClick,
        requestPayout,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
}
