/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - DNA CONTROL PANEL
 * Fixed transparent bar for phenotype control with animated sliders
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Component, createSignal, createEffect, Show } from 'solid-js';
import { state, actions, Phenotype } from '../store';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED SLIDER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
  icon: string;
  minLabel?: string;
  maxLabel?: string;
}

const AnimatedSlider: Component<SliderProps> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);
  const [localValue, setLocalValue] = createSignal(props.value);
  
  createEffect(() => {
    if (!isDragging()) {
      setLocalValue(props.value);
    }
  });
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    setLocalValue(value);
    props.onChange(value);
  };
  
  return (
    <div class="dna-slider-container">
      <div class="dna-slider-header">
        <span class="dna-slider-icon">{props.icon}</span>
        <span class="dna-slider-label">{props.label}</span>
        <span 
          class="dna-slider-value"
          style={{ color: props.color }}
        >
          {(localValue() * 100).toFixed(0)}%
        </span>
      </div>
      
      <div class="dna-slider-track-container">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localValue()}
          onInput={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          class="dna-slider-input"
          style={{
            '--slider-color': props.color,
            '--slider-progress': `${localValue() * 100}%`,
          } as any}
        />
        
        <div class="dna-slider-labels">
          <span class="dna-slider-min">{props.minLabel || '0%'}</span>
          <span class="dna-slider-max">{props.maxLabel || '100%'}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GENOME INDICATOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const GenomeIndicator: Component = () => {
  return (
    <div class="genome-indicator">
      <div class="genome-header">
        <span class="genome-icon">🧬</span>
        <span class="genome-label">ACTIVE GENOME</span>
      </div>
      
      <Show when={state.activeGenome} fallback={
        <div class="genome-empty">No genome active</div>
      }>
        <div class="genome-info">
          <div class="genome-id">
            {state.activeGenome!.genomeId.slice(0, 16)}...
          </div>
          <div class="genome-stats">
            <div class="genome-stat">
              <span class="stat-label">Gen</span>
              <span class="stat-value text-purple">#{state.activeGenome!.generation}</span>
            </div>
            <div class="genome-stat">
              <span class="stat-label">Sharpe</span>
              <span class="stat-value" classList={{
                'text-green': state.activeGenome!.sharpeRatio > 1,
                'text-cyan': state.activeGenome!.sharpeRatio > 0 && state.activeGenome!.sharpeRatio <= 1,
                'text-red': state.activeGenome!.sharpeRatio <= 0,
              }}>
                {state.activeGenome!.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div class="genome-stat">
              <span class="stat-label">Rank</span>
              <span class="stat-value text-cyan">#{state.activeGenome!.fitnessRank}</span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DNA CONTROL PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const DNAControlPanel: Component = () => {
  const [isExpanded, setIsExpanded] = createSignal(true);
  const [isLocked, setIsLocked] = createSignal(false);
  
  const handlePhenotypeChange = (key: keyof Phenotype, value: number) => {
    if (isLocked()) return;
    
    actions.setPhenotype({ [key]: value });
    
    // Log significant changes
    if (Math.random() > 0.8) {
      actions.addLog('quantum', 'DNA', 
        `Phenotype bias updated: ${key} = ${(value * 100).toFixed(0)}%`
      );
    }
  };
  
  const handleApplyBias = () => {
    actions.addLog('info', 'DNA', '🧬 Phenotype bias applied to evolution cycle');
    
    // This would trigger the GA to prioritize genomes matching this phenotype
    actions.addLog('quantum', 'GA', 
      `Selection pressure: R=${(state.currentPhenotype.riskLevel * 100).toFixed(0)}% ` +
      `H=${(state.currentPhenotype.timeHorizon * 100).toFixed(0)}% ` +
      `T=${(state.currentPhenotype.trendBias * 100).toFixed(0)}% ` +
      `V=${(state.currentPhenotype.volatilityAffinity * 100).toFixed(0)}%`
    );
  };
  
  const handleResetBias = () => {
    actions.setPhenotype({
      riskLevel: 0.5,
      timeHorizon: 0.5,
      trendBias: 0.5,
      volatilityAffinity: 0.5,
    });
    
    actions.addLog('info', 'DNA', 'Phenotype bias reset to neutral');
  };
  
  return (
    <div 
      class="dna-control-panel"
      classList={{ 
        expanded: isExpanded(),
        collapsed: !isExpanded(),
        locked: isLocked(),
      }}
    >
      {/* Toggle Button */}
      <button 
        class="dna-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded())}
        title={isExpanded() ? 'Collapse' : 'Expand'}
      >
        <span class="toggle-icon">{isExpanded() ? '▼' : '▲'}</span>
        <span class="toggle-label">DNA CONTROL</span>
      </button>
      
      <Show when={isExpanded()}>
        <div class="dna-content">
          {/* Genome Indicator */}
          <GenomeIndicator />
          
          {/* Sliders */}
          <div class="dna-sliders">
            <AnimatedSlider
              label="Risk Level"
              icon="⚡"
              value={state.currentPhenotype.riskLevel}
              onChange={(v) => handlePhenotypeChange('riskLevel', v)}
              color="#ff4040"
              minLabel="Conservative"
              maxLabel="Aggressive"
            />
            
            <AnimatedSlider
              label="Time Horizon"
              icon="⏱️"
              value={state.currentPhenotype.timeHorizon}
              onChange={(v) => handlePhenotypeChange('timeHorizon', v)}
              color="#00f3ff"
              minLabel="Scalping"
              maxLabel="Position"
            />
            
            <AnimatedSlider
              label="Trend Bias"
              icon="📈"
              value={state.currentPhenotype.trendBias}
              onChange={(v) => handlePhenotypeChange('trendBias', v)}
              color="#bc13fe"
              minLabel="Contrarian"
              maxLabel="Trend Follow"
            />
            
            <AnimatedSlider
              label="Volatility Affinity"
              icon="🌊"
              value={state.currentPhenotype.volatilityAffinity}
              onChange={(v) => handlePhenotypeChange('volatilityAffinity', v)}
              color="#ffaa00"
              minLabel="Low Vol"
              maxLabel="High Vol"
            />
          </div>
          
          {/* Control Buttons */}
          <div class="dna-actions">
            <button 
              class="dna-btn dna-btn-lock"
              onClick={() => setIsLocked(!isLocked())}
              title={isLocked() ? 'Unlock sliders' : 'Lock sliders'}
            >
              {isLocked() ? '🔒' : '🔓'}
            </button>
            
            <button 
              class="dna-btn dna-btn-reset"
              onClick={handleResetBias}
              disabled={isLocked()}
            >
              Reset
            </button>
            
            <button 
              class="dna-btn dna-btn-apply"
              onClick={handleApplyBias}
              disabled={isLocked()}
            >
              Apply Bias
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default DNAControlPanel;
