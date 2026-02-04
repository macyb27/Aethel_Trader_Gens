/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - GLOBAL STATE STORE
 * Solid.js Reactive Store with Signal-Based Architecture
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createRoot } from 'solid-js';
import { createStore, produce } from 'solid-js/store';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type ViewMode = 'flow' | 'nexus';
export type OracleStatus = 'initializing' | 'ready' | 'active' | 'survival' | 'error';

export interface StrategyDNA {
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
  lastSentiment: number;
  isActive: boolean;
  isSurvivalDna: boolean;
  fitnessRank: number;
}

export interface Phenotype {
  riskLevel: number;        // 0.0 - 1.0
  timeHorizon: number;      // 0.0 - 1.0
  trendBias: number;        // 0.0 - 1.0
  volatilityAffinity: number; // 0.0 - 1.0
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success' | 'quantum';
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdate: number;
}

export interface PortfolioState {
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  positions: Position[];
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  leverage: number;
}

export interface CrisisState {
  isActive: boolean;
  severity: number;
  triggerType: string | null;
  activatedAt: number | null;
}

export interface GSMNode {
  id: string;
  genomeId: string;
  x: number;
  y: number;
  z: number; // Entanglement score as depth
  sharpeRatio: number;
  isSelected: boolean;
  color: string;
}

export interface AppState {
  // Core State
  mode: ViewMode;
  status: OracleStatus;
  isTransitioning: boolean;
  
  // Oracle State
  agentsSpawned: number;
  totalAgents: number;
  loadingProgress: number;
  
  // Strategy State
  activeGenome: StrategyDNA | null;
  population: StrategyDNA[];
  currentPhenotype: Phenotype;
  
  // GSM (Generative Strategy Matrix)
  gsmNodes: GSMNode[];
  selectedNodeId: string | null;
  
  // Market Data
  marketData: Record<string, MarketData>;
  
  // Portfolio
  portfolio: PortfolioState;
  
  // Crisis Mode
  crisis: CrisisState;
  
  // Logs
  logs: LogEntry[];
  maxLogs: number;
  
  // UI State
  showAwakeningModal: boolean;
  showReportModal: boolean;
  finalReport: FinalReport | null;
}

export interface FinalReport {
  bestGenome: StrategyDNA;
  sharpeRatio: number;
  maxDrawdown: number;
  totalGenerations: number;
  populationSize: number;
  gsmSnapshot: string; // Base64 encoded image
  generatedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const initialState: AppState = {
  mode: 'flow',
  status: 'initializing',
  isTransitioning: false,
  
  agentsSpawned: 0,
  totalAgents: 500,
  loadingProgress: 0,
  
  activeGenome: null,
  population: [],
  currentPhenotype: {
    riskLevel: 0.5,
    timeHorizon: 0.5,
    trendBias: 0.5,
    volatilityAffinity: 0.5,
  },
  
  gsmNodes: [],
  selectedNodeId: null,
  
  marketData: {},
  
  portfolio: {
    totalValue: 0,
    unrealizedPnL: 0,
    realizedPnL: 0,
    positions: [],
  },
  
  crisis: {
    isActive: false,
    severity: 0,
    triggerType: null,
    activatedAt: null,
  },
  
  logs: [],
  maxLogs: 500,
  
  showAwakeningModal: false,
  showReportModal: false,
  finalReport: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE CREATION (Root-Level Singleton)
// ─────────────────────────════════════════════════════════════════════════════

function createAppStore() {
  const [state, setState] = createStore<AppState>(initialState);
  
  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const actions = {
    // Mode Management
    setMode(mode: ViewMode) {
      setState('isTransitioning', true);
      setTimeout(() => {
        setState('mode', mode);
        setTimeout(() => setState('isTransitioning', false), 200);
      }, 150);
    },
    
    toggleMode() {
      actions.setMode(state.mode === 'flow' ? 'nexus' : 'flow');
    },
    
    // Status Management
    setStatus(status: OracleStatus) {
      setState('status', status);
    },
    
    // Loading Progress
    updateLoadingProgress(agents: number, progress: number) {
      setState(produce((s) => {
        s.agentsSpawned = agents;
        s.loadingProgress = progress;
      }));
    },
    
    // Genome Management
    setActiveGenome(genome: StrategyDNA | null) {
      setState('activeGenome', genome);
    },
    
    updatePopulation(population: StrategyDNA[]) {
      setState('population', population);
      // Update GSM nodes
      const nodes: GSMNode[] = population.map((dna, index) => ({
        id: `node-${index}`,
        genomeId: dna.genomeId,
        x: (dna.riskLevel - 0.5) * 10,
        y: (dna.timeHorizon - 0.5) * 10,
        z: dna.entanglementScore * 5,
        sharpeRatio: dna.sharpeRatio,
        isSelected: dna.isActive,
        color: sharpeToColor(dna.sharpeRatio),
      }));
      setState('gsmNodes', nodes);
    },
    
    // Phenotype Control
    setPhenotype(phenotype: Partial<Phenotype>) {
      setState('currentPhenotype', { ...state.currentPhenotype, ...phenotype });
    },
    
    // GSM Selection
    selectNode(nodeId: string | null) {
      setState('selectedNodeId', nodeId);
      if (nodeId) {
        setState('gsmNodes', (nodes) =>
          nodes.map((n) => ({ ...n, isSelected: n.id === nodeId }))
        );
      }
    },
    
    // Market Data
    updateMarketData(symbol: string, data: MarketData) {
      setState('marketData', symbol, data);
    },
    
    // Portfolio
    updatePortfolio(portfolio: Partial<PortfolioState>) {
      setState('portfolio', { ...state.portfolio, ...portfolio });
    },
    
    // Crisis Management
    activateCrisis(triggerType: string, severity: number) {
      setState('crisis', {
        isActive: true,
        severity,
        triggerType,
        activatedAt: Date.now(),
      });
      setState('status', 'survival');
      actions.addLog('error', 'SHIELD', `🛡️ ORACLE SHIELD ACTIVATED: ${triggerType}`);
    },
    
    deactivateCrisis() {
      setState('crisis', {
        isActive: false,
        severity: 0,
        triggerType: null,
        activatedAt: null,
      });
      setState('status', 'active');
      actions.addLog('success', 'SHIELD', '✅ Crisis resolved. Resuming normal operations.');
    },
    
    // Logging
    addLog(level: LogEntry['level'], source: string, message: string, data?: Record<string, unknown>) {
      const entry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        level,
        source,
        message,
        data,
      };
      
      setState(produce((s) => {
        s.logs.unshift(entry);
        if (s.logs.length > s.maxLogs) {
          s.logs = s.logs.slice(0, s.maxLogs);
        }
      }));
    },
    
    clearLogs() {
      setState('logs', []);
    },
    
    // Modal Management
    showAwakening(show: boolean) {
      setState('showAwakeningModal', show);
    },
    
    showReport(report: FinalReport | null) {
      setState('finalReport', report);
      setState('showReportModal', report !== null);
    },
    
    // Reset
    reset() {
      setState(initialState);
    },
  };
  
  return { state, actions };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function sharpeToColor(sharpe: number): string {
  // Map Sharpe ratio to color gradient
  // Negative: Red -> Neutral: Purple -> Positive: Cyan
  if (sharpe < 0) {
    const intensity = Math.min(1, Math.abs(sharpe) / 2);
    return `rgb(${255}, ${Math.round(64 * (1 - intensity))}, ${Math.round(64 * (1 - intensity))})`;
  } else if (sharpe < 1) {
    const t = sharpe;
    return `rgb(${Math.round(188 - 188 * t)}, ${Math.round(19 + 224 * t)}, ${Math.round(254 - 1 * t)})`;
  } else {
    return '#00f3ff'; // Neon cyan for excellent performance
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const store = createRoot(createAppStore);

// Convenience exports
export const { state, actions } = store;
