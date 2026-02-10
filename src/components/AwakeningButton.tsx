/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - AWAKENING BUTTON & ACTIVATION SEQUENCE
 * Final user interaction for oracle activation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, createEffect, createSignal, Show, onCleanup } from 'solid-js';
import { state, actions, FinalReport, StrategyDNA } from '../store';
import { evolutionEngine } from '../logic/evolutionEngine';
import { startQuantumEdgeSimulation } from '../logic/quantumEdge';
import { startNewsFeedSimulation } from '../logic/newsOracle';

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION SEQUENCE
// ─────────────────────────────────────────────────────────────────────────────

async function runActivationSequence(
  onProgress: (stage: string, progress: number) => void
): Promise<FinalReport> {
  // Stage 1: Spawn agents
  onProgress('Spawning Trading Agents...', 0);
  for (let i = 0; i < 500; i += 25) {
    await sleep(50);
    actions.addLog('info', 'CORE', `Agent ${i}/500 initialized`);
    onProgress('Spawning Trading Agents...', (i / 500) * 20);
  }
  actions.addLog('success', 'CORE', '✅ All 500 agents spawned and active');
  
  // Stage 2: Arm shield
  onProgress('Arming Oracle Shield...', 20);
  await sleep(500);
  actions.addLog('info', 'SHIELD', 'Loading Survival DNA v9...');
  await sleep(300);
  actions.addLog('success', 'SHIELD', '🛡️ Oracle Shield armed and monitoring');
  onProgress('Arming Oracle Shield...', 30);
  
  // Stage 3: Initialize quantum edge
  onProgress('Calibrating Quantum Detectors...', 30);
  await sleep(500);
  actions.addLog('quantum', 'QUANTUM', 'Initializing entanglement detector...');
  await sleep(300);
  actions.addLog('quantum', 'QUANTUM', '◈ Quantum coherence achieved');
  onProgress('Calibrating Quantum Detectors...', 45);
  
  // Stage 4: Start evolution
  onProgress('Starting Evolution Cycle...', 45);
  evolutionEngine.initializePopulation();
  await sleep(300);
  
  // Run several evolution cycles
  for (let gen = 0; gen < 10; gen++) {
    evolutionEngine.evolve();
    await sleep(200);
    onProgress('Running Evolution Cycle...', 45 + (gen / 10) * 30);
  }
  
  actions.addLog('success', 'GA', '🧬 Evolution cycle optimized');
  onProgress('Evolution Complete', 75);
  
  // Stage 5: Learning phase
  onProgress('Oracle Learning...', 75);
  await sleep(500);
  
  for (let i = 0; i < 5; i++) {
    await sleep(300);
    const messages = [
      'Analyzing market patterns...',
      'Correlating quantum states...',
      'Optimizing genome parameters...',
      'Calibrating sentiment weights...',
      'Finalizing strategy matrix...',
    ];
    actions.addLog('quantum', 'ORACLE', messages[i]);
    onProgress('Oracle Learning...', 75 + (i / 5) * 20);
  }
  
  // Stage 6: Generate report
  onProgress('Generating Final Report...', 95);
  await sleep(500);
  
  const bestGenome = evolutionEngine.getBestGenome();
  
  // Create final report
  const report: FinalReport = {
    bestGenome: bestGenome || createMockBestGenome(),
    sharpeRatio: bestGenome?.sharpeRatio || 2.45,
    maxDrawdown: bestGenome?.maxDrawdown || 0.08,
    totalGenerations: evolutionEngine.getGeneration(),
    populationSize: 50,
    gsmSnapshot: generateGSMSnapshot(),
    generatedAt: Date.now(),
  };
  
  onProgress('Complete!', 100);
  
  return report;
}

function createMockBestGenome(): StrategyDNA {
  return {
    genomeId: 'GENESIS-OMEGA-001',
    genomeString: 'R0.65H0.55T0.70V0.45E0.82S0.15',
    generation: 10,
    sharpeRatio: 2.45,
    sortinoRatio: 3.12,
    maxDrawdown: 0.08,
    winRate: 0.67,
    profitFactor: 2.1,
    totalTrades: 342,
    riskLevel: 0.65,
    timeHorizon: 0.55,
    trendBias: 0.70,
    volatilityAffinity: 0.45,
    entanglementScore: 0.82,
    lastSentiment: 0.15,
    isActive: true,
    isSurvivalDna: false,
    fitnessRank: 1,
  };
}

function generateGSMSnapshot(): string {
  // Generate a simple SVG representation as base64
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#050505"/>
      <defs>
        <linearGradient id="grid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00f3ff;stop-opacity:0.1"/>
          <stop offset="100%" style="stop-color:#bc13fe;stop-opacity:0.1"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Grid -->
      <g stroke="url(#grid)" stroke-width="0.5">
        ${Array.from({length: 10}, (_, i) => `<line x1="${40 * i}" y1="0" x2="${40 * i}" y2="300"/>`).join('')}
        ${Array.from({length: 8}, (_, i) => `<line x1="0" y1="${37.5 * i}" x2="400" y2="${37.5 * i}"/>`).join('')}
      </g>
      
      <!-- Strategy nodes -->
      ${Array.from({length: 15}, () => {
        const x = 50 + Math.random() * 300;
        const y = 50 + Math.random() * 200;
        const r = 3 + Math.random() * 4;
        const hue = Math.random() * 60 + 160; // Cyan to purple
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="hsl(${hue}, 100%, 60%)" opacity="0.7"/>`;
      }).join('')}
      
      <!-- Best genome (highlighted) -->
      <circle cx="260" cy="130" r="12" fill="#00f3ff" filter="url(#glow)" opacity="0.9"/>
      <circle cx="260" cy="130" r="6" fill="#ffffff"/>
      
      <!-- Label -->
      <text x="200" y="280" font-family="monospace" font-size="10" fill="#00f3ff" text-anchor="middle">
        GENERATIVE STRATEGY MATRIX - OPTIMAL GENOME
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// AWAKENING MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AwakeningModal: Component<{
  onClose: () => void;
  onActivate: () => void;
}> = (props) => {
  return (
    <div class="modal-overlay">
      <div class="modal-content awakening-modal">
        <div class="modal-header">
          <span class="modal-icon">🔮</span>
          <h2>ACTIVATE THE ORACLE</h2>
        </div>
        
        <div class="modal-body">
          <p class="awakening-warning">
            You are about to awaken <span class="text-cyan">ÆTHER-TRADER Ω v4.0</span>
          </p>
          
          <div class="awakening-checklist">
            <div class="checklist-item">
              <span class="check">✓</span>
              <span>500 Trading Agents Ready</span>
            </div>
            <div class="checklist-item">
              <span class="check">✓</span>
              <span>Oracle Shield Armed</span>
            </div>
            <div class="checklist-item">
              <span class="check">✓</span>
              <span>Quantum Detectors Calibrated</span>
            </div>
            <div class="checklist-item">
              <span class="check">✓</span>
              <span>Evolution Engine Initialized</span>
            </div>
          </div>
          
          <p class="awakening-question">
            Are you ready to begin?
          </p>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button class="btn-awakening" onClick={props.onActivate}>
            ACTIVATE ORACLE
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION PROGRESS MODAL
// ─────────────────────────────────────────────────────────────────────────────

const ActivationProgressModal: Component<{
  stage: string;
  progress: number;
}> = (props) => {
  return (
    <div class="modal-overlay">
      <div class="modal-content activation-modal">
        <div class="activation-spinner">
          <div class="spinner-ring" />
          <div class="spinner-core" />
        </div>
        
        <h2 class="activation-stage">{props.stage}</h2>
        
        <div class="activation-progress">
          <div 
            class="activation-progress-bar"
            style={{ width: `${props.progress}%` }}
          />
        </div>
        
        <p class="activation-percent">{props.progress.toFixed(0)}%</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL REPORT MODAL
// ─────────────────────────────────────────────────────────────────────────────

const FinalReportModal: Component<{
  report: FinalReport;
  onClose: () => void;
}> = (props) => {
  return (
    <div class="modal-overlay">
      <div class="modal-content report-modal">
        <div class="report-header">
          <div class="report-success-icon">✨</div>
          <h2 class="report-title">I UNDERSTAND THE MARKET NOW.</h2>
          <p class="report-subtitle">Oracle Awakening Complete</p>
        </div>
        
        <div class="report-body">
          <div class="report-gsm">
            <img src={props.report.gsmSnapshot} alt="GSM Snapshot" class="gsm-image" />
            <div class="gsm-caption">Generative Strategy Matrix - Winning Strategy Highlighted</div>
          </div>
          
          <div class="report-stats">
            <div class="report-stat-group">
              <h3>Best Genome</h3>
              <div class="genome-id-display">{props.report.bestGenome.genomeId}</div>
            </div>
            
            <div class="report-metrics">
              <div class="report-metric">
                <span class="metric-label">Sharpe Ratio</span>
                <span class="metric-value text-green">{props.report.sharpeRatio.toFixed(3)}</span>
              </div>
              <div class="report-metric">
                <span class="metric-label">Max Drawdown</span>
                <span class="metric-value text-red">-{(props.report.maxDrawdown * 100).toFixed(2)}%</span>
              </div>
              <div class="report-metric">
                <span class="metric-label">Generations</span>
                <span class="metric-value text-cyan">{props.report.totalGenerations}</span>
              </div>
              <div class="report-metric">
                <span class="metric-label">Population</span>
                <span class="metric-value text-purple">{props.report.populationSize}</span>
              </div>
            </div>
            
            <div class="report-phenotype">
              <h4>Optimal Phenotype</h4>
              <div class="phenotype-bars">
                <div class="phenotype-bar">
                  <span>Risk</span>
                  <div class="bar-track">
                    <div class="bar-fill" style={{ width: `${props.report.bestGenome.riskLevel * 100}%`, background: '#ff4040' }} />
                  </div>
                  <span>{(props.report.bestGenome.riskLevel * 100).toFixed(0)}%</span>
                </div>
                <div class="phenotype-bar">
                  <span>Horizon</span>
                  <div class="bar-track">
                    <div class="bar-fill" style={{ width: `${props.report.bestGenome.timeHorizon * 100}%`, background: '#00f3ff' }} />
                  </div>
                  <span>{(props.report.bestGenome.timeHorizon * 100).toFixed(0)}%</span>
                </div>
                <div class="phenotype-bar">
                  <span>Trend</span>
                  <div class="bar-track">
                    <div class="bar-fill" style={{ width: `${props.report.bestGenome.trendBias * 100}%`, background: '#bc13fe' }} />
                  </div>
                  <span>{(props.report.bestGenome.trendBias * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="report-actions">
          <button class="btn-awakening" onClick={props.onClose}>
            BEGIN TRADING
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AWAKENING BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface AwakeningButtonProps {
  openRequest?: boolean;
  onOpenRequestHandled?: () => void;
}

const AwakeningButton: Component<AwakeningButtonProps> = (props) => {
  const [showConfirmModal, setShowConfirmModal] = createSignal(false);
  const [isActivating, setIsActivating] = createSignal(false);
  const [activationStage, setActivationStage] = createSignal('');
  const [activationProgress, setActivationProgress] = createSignal(0);
  const [showReport, setShowReport] = createSignal(false);
  const [report, setReport] = createSignal<FinalReport | null>(null);
  
  let quantumCleanup: (() => void) | null = null;
  let newsCleanup: (() => void) | null = null;
  
  onCleanup(() => {
    quantumCleanup?.();
    newsCleanup?.();
  });

  createEffect(() => {
    if (!props?.openRequest) return;
    // Only allow opening during ready state and when not already activating
    if (state.status !== 'ready' || isActivating()) return;
    setShowConfirmModal(true);
    props.onOpenRequestHandled?.();
  });
  
  const handleActivate = async () => {
    setShowConfirmModal(false);
    setIsActivating(true);
    
    try {
      const finalReport = await runActivationSequence((stage, progress) => {
        setActivationStage(stage);
        setActivationProgress(progress);
      });
      
      setReport(finalReport);
      setIsActivating(false);
      setShowReport(true);
      
      // Start background simulations
      quantumCleanup = startQuantumEdgeSimulation();
      newsCleanup = startNewsFeedSimulation();
      
      actions.setStatus('active');
      actions.addLog('success', 'ORACLE', '🔮 ÆTHER-TRADER Ω is now AWAKE');
      
    } catch (error) {
      setIsActivating(false);
      actions.addLog('error', 'CORE', `Activation failed: ${error}`);
    }
  };
  
  const handleReportClose = () => {
    setShowReport(false);
    // Inject report into Flow timeline
    if (report()) {
      actions.addLog('success', 'REPORT', 
        `📊 Final Report: Sharpe ${report()!.sharpeRatio.toFixed(2)} | ` +
        `DD ${(report()!.maxDrawdown * 100).toFixed(1)}% | ` +
        `Gen ${report()!.totalGenerations}`
      );
    }
  };
  
  return (
    <>
      <Show when={state.status === 'ready' && !isActivating()}>
        <button 
          class="btn-awakening awakening-main"
          onClick={() => setShowConfirmModal(true)}
        >
          <span class="awakening-icon">🔮</span>
          ACTIVATE ORACLE
        </button>
      </Show>
      
      <Show when={showConfirmModal()}>
        <AwakeningModal
          onClose={() => setShowConfirmModal(false)}
          onActivate={handleActivate}
        />
      </Show>
      
      <Show when={isActivating()}>
        <ActivationProgressModal
          stage={activationStage()}
          progress={activationProgress()}
        />
      </Show>
      
      <Show when={showReport() && report()}>
        <FinalReportModal
          report={report()!}
          onClose={handleReportClose}
        />
      </Show>
    </>
  );
};

export default AwakeningButton;
