import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  TradingAppState,
  loadTradingState,
  saveTradingState,
  executeTrade,
  updatePositionPrices,
  initializePopulation,
  evolveGeneration,
  addNewsItem,
  updateAggregatedSentiment,
  resetTradingState,
  Trade,
  NewsItem,
} from "./trading-store";
import { 
  getMLModel, 
  trainModel, 
  getPrediction, 
  getModelMetadata, 
  TrainingProgress, 
  PredictionResult, 
  MLModelMetadata 
} from "./transfer-learning";

interface TradingContextType {
  state: TradingAppState | null;
  isLoading: boolean;
  // Trading actions
  buy: (symbol: string, size: number, leverage?: number) => Promise<{ success: boolean; message: string; trade?: Trade }>;
  sell: (symbol: string, size: number) => Promise<{ success: boolean; message: string; trade?: Trade }>;
  // GA actions
  startEvolution: () => void;
  stopEvolution: () => void;
  // News actions
  addNews: (headline: string, source: string, symbols: string[]) => Promise<NewsItem>;
  // Utility actions
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  // Transfer Learning
  mlMetadata: MLModelMetadata | null;
  isTrainingML: boolean;
  trainingProgress: TrainingProgress | null;
  trainMLModel: (epochs?: number) => Promise<void>;
  getMLPrediction: () => Promise<PredictionResult | null>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TradingAppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mlMetadata, setMLMetadata] = useState<MLModelMetadata | null>(null);
  const [isTrainingML, setIsTrainingML] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const evolutionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load initial state
  useEffect(() => {
    loadTradingState().then(async (loadedState) => {
      setState(loadedState);
      setIsLoading(false);
      
      // Initialize GA population if empty
      if (loadedState.geneticAlgorithm.population.length === 0) {
        await initializePopulation();
        const newState = await loadTradingState();
        setState(newState);
      }
      
      // Load ML metadata
      const metadata = await getModelMetadata();
      setMLMetadata(metadata);
    });
  }, []);

  // Price update interval
  useEffect(() => {
    priceUpdateIntervalRef.current = setInterval(async () => {
      await updatePositionPrices();
      const newState = await loadTradingState();
      setState(newState);
    }, 5000);

    return () => {
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    const newState = await loadTradingState();
    setState(newState);
    
    // Refresh ML metadata
    const metadata = await getModelMetadata();
    setMLMetadata(metadata);
  }, []);

  const buy = useCallback(async (symbol: string, size: number, leverage: number = 1) => {
    const result = await executeTrade(symbol, "buy", size, leverage);
    await refresh();
    return result;
  }, [refresh]);

  const sell = useCallback(async (symbol: string, size: number) => {
    const result = await executeTrade(symbol, "sell", size, 1);
    await refresh();
    return result;
  }, [refresh]);

  const startEvolution = useCallback(() => {
    if (evolutionIntervalRef.current) return;

    evolutionIntervalRef.current = setInterval(async () => {
      await evolveGeneration();
      await refresh();
    }, 2000);

    // Update state to show running
    loadTradingState().then((s) => {
      s.geneticAlgorithm.isRunning = true;
      saveTradingState(s).then(refresh);
    });
  }, [refresh]);

  const stopEvolution = useCallback(() => {
    if (evolutionIntervalRef.current) {
      clearInterval(evolutionIntervalRef.current);
      evolutionIntervalRef.current = null;
    }

    // Update state to show stopped
    loadTradingState().then((s) => {
      s.geneticAlgorithm.isRunning = false;
      saveTradingState(s).then(refresh);
    });
  }, [refresh]);

  const addNews = useCallback(async (headline: string, source: string, symbols: string[]) => {
    const newsItem = await addNewsItem(headline, source, symbols);
    await refresh();
    return newsItem;
  }, [refresh]);

  const reset = useCallback(async () => {
    stopEvolution();
    await resetTradingState();
    await initializePopulation();
    await refresh();
  }, [refresh, stopEvolution]);

  const trainMLModel = useCallback(async (epochs: number = 50) => {
    if (!state || state.trades.length < 30) {
      throw new Error("Mindestens 30 Trades erforderlich für Training");
    }

    setIsTrainingML(true);
    setTrainingProgress({ epoch: 0, totalEpochs: epochs, loss: 0, accuracy: 0, isTraining: true });

    try {
      await trainModel(state.trades, epochs, (progress) => {
        setTrainingProgress(progress);
      });

      // Reload metadata after training
      const metadata = await getModelMetadata();
      setMLMetadata(metadata);
    } finally {
      setIsTrainingML(false);
      setTrainingProgress(null);
    }
  }, [state]);

  const getMLPrediction = useCallback(async (): Promise<PredictionResult | null> => {
    if (!state || state.trades.length < 20) {
      return null;
    }

    try {
      const prediction = await getPrediction(state.trades);
      return prediction;
    } catch (error) {
      console.error("Prediction failed:", error);
      return null;
    }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (evolutionIntervalRef.current) {
        clearInterval(evolutionIntervalRef.current);
      }
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
      }
    };
  }, []);

  return (
    <TradingContext.Provider
      value={{
        state,
        isLoading,
        buy,
        sell,
        startEvolution,
        stopEvolution,
        addNews,
        refresh,
        reset,
        mlMetadata,
        isTrainingML,
        trainingProgress,
        trainMLModel,
        getMLPrediction,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error("useTrading must be used within a TradingProvider");
  }
  return context;
}
