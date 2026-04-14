//! ═══════════════════════════════════════════════════════════════════════════
//! ÆTHER-TRADER Ω v4.0 - ORACLE SHIELD LOGIC
//! Crisis detection and survival mode management
//! ═══════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use crate::AppState;

// ─────────────────────────────────────────────────────────────────────────────
// CRISIS DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CrisisTrigger {
    VixSpike,           // Volatility index > 50
    FundingExtreme,     // Funding rate > 0.1% or < -0.1%
    LiquidationCascade, // Mass liquidations detected
    FlashCrash,         // > 5% move in < 1 minute
    ExchangeAnomaly,    // Exchange connectivity issues
    BlackSwan,          // Multiple triggers simultaneously
}

impl CrisisTrigger {
    pub fn as_str(&self) -> &'static str {
        match self {
            CrisisTrigger::VixSpike => "VIX_SPIKE",
            CrisisTrigger::FundingExtreme => "FUNDING_EXTREME",
            CrisisTrigger::LiquidationCascade => "LIQUIDATION_CASCADE",
            CrisisTrigger::FlashCrash => "FLASH_CRASH",
            CrisisTrigger::ExchangeAnomaly => "EXCHANGE_ANOMALY",
            CrisisTrigger::BlackSwan => "BLACK_SWAN",
        }
    }
    
    pub fn severity(&self) -> f64 {
        match self {
            CrisisTrigger::VixSpike => 0.6,
            CrisisTrigger::FundingExtreme => 0.5,
            CrisisTrigger::LiquidationCascade => 0.8,
            CrisisTrigger::FlashCrash => 0.9,
            CrisisTrigger::ExchangeAnomaly => 0.4,
            CrisisTrigger::BlackSwan => 1.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrisisConditions {
    pub vix_value: f64,
    pub funding_rate: f64,
    pub liquidation_volume_24h: f64,
    pub price_change_1m: f64,
    pub exchange_latency_ms: u64,
}

impl Default for CrisisConditions {
    fn default() -> Self {
        Self {
            vix_value: 20.0,
            funding_rate: 0.0001,
            liquidation_volume_24h: 0.0,
            price_change_1m: 0.0,
            exchange_latency_ms: 50,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrisisCheckResult {
    pub is_critical: bool,
    pub triggers: Vec<String>,
    pub max_severity: f64,
    pub recommended_action: String,
}

// ─────────────────────────────────────────────────────────────────────────────
// CRISIS DETECTION
// ─────────────────────────────────────────────────────────────────────────────

/// Check current market conditions for crisis triggers
#[tauri::command]
pub async fn check_crisis_conditions(
    conditions: Option<CrisisConditions>
) -> Result<CrisisCheckResult, String> {
    let cond = conditions.unwrap_or_default();
    
    let mut triggers: Vec<CrisisTrigger> = Vec::new();
    
    // VIX Spike Detection (threshold: 50)
    if cond.vix_value > 50.0 {
        triggers.push(CrisisTrigger::VixSpike);
        tracing::warn!("🚨 VIX spike detected: {:.2}", cond.vix_value);
    }
    
    // Funding Rate Extreme (threshold: ±0.1%)
    if cond.funding_rate.abs() > 0.001 {
        triggers.push(CrisisTrigger::FundingExtreme);
        tracing::warn!("🚨 Extreme funding rate: {:.4}%", cond.funding_rate * 100.0);
    }
    
    // Liquidation Cascade (threshold: $500M in 24h)
    if cond.liquidation_volume_24h > 500_000_000.0 {
        triggers.push(CrisisTrigger::LiquidationCascade);
        tracing::warn!("🚨 Liquidation cascade: ${:.2}M", cond.liquidation_volume_24h / 1_000_000.0);
    }
    
    // Flash Crash (threshold: >5% in 1 minute)
    if cond.price_change_1m.abs() > 0.05 {
        triggers.push(CrisisTrigger::FlashCrash);
        tracing::warn!("🚨 Flash crash detected: {:.2}% in 1m", cond.price_change_1m * 100.0);
    }
    
    // Exchange Anomaly (threshold: >1000ms latency)
    if cond.exchange_latency_ms > 1000 {
        triggers.push(CrisisTrigger::ExchangeAnomaly);
        tracing::warn!("🚨 Exchange anomaly: {}ms latency", cond.exchange_latency_ms);
    }
    
    // Black Swan: multiple triggers
    if triggers.len() >= 3 {
        triggers.push(CrisisTrigger::BlackSwan);
        tracing::error!("🦢 BLACK SWAN EVENT DETECTED!");
    }
    
    let is_critical = !triggers.is_empty();
    let max_severity = triggers.iter()
        .map(|t| t.severity())
        .max_by(|a, b| a.partial_cmp(b).unwrap())
        .unwrap_or(0.0);
    
    let recommended_action = if max_severity >= 0.8 {
        "IMMEDIATE: Activate Shield, close all positions, load Survival DNA".to_string()
    } else if max_severity >= 0.5 {
        "CAUTION: Reduce position size, tighten stop losses".to_string()
    } else if max_severity > 0.0 {
        "MONITOR: Increase monitoring frequency".to_string()
    } else {
        "NORMAL: Continue standard operations".to_string()
    };
    
    Ok(CrisisCheckResult {
        is_critical,
        triggers: triggers.iter().map(|t| t.as_str().to_string()).collect(),
        max_severity,
        recommended_action,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIELD CONTROL
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShieldActivationResult {
    pub success: bool,
    pub survival_dna_loaded: bool,
    pub positions_closed: u32,
    pub message: String,
}

/// Activate Oracle Shield (crisis mode)
#[tauri::command]
pub async fn activate_shield(
    state: State<'_, AppState>,
    trigger_type: String,
) -> Result<ShieldActivationResult, String> {
    // Set shield state
    {
        let mut shield_active = state.is_shield_active.lock().unwrap();
        if *shield_active {
            return Ok(ShieldActivationResult {
                success: false,
                survival_dna_loaded: false,
                positions_closed: 0,
                message: "Shield already active".to_string(),
            });
        }
        *shield_active = true;
    }
    
    // Load Survival DNA
    {
        let mut active_genome = state.active_genome_id.lock().unwrap();
        *active_genome = Some("SURVIVAL-DNA-V9".to_string());
    }
    
    tracing::warn!("🛡️ ORACLE SHIELD ACTIVATED: {}", trigger_type);
    tracing::info!("Loading Survival DNA v9 (Delta-Neutral Mode)");
    
    // In production: Close all positions via exchange API
    let positions_closed = simulate_close_positions().await;
    
    Ok(ShieldActivationResult {
        success: true,
        survival_dna_loaded: true,
        positions_closed,
        message: format!(
            "Shield activated due to {}. {} positions closed. Survival DNA loaded.",
            trigger_type, positions_closed
        ),
    })
}

/// Deactivate Oracle Shield (return to normal operations)
#[tauri::command]
pub async fn deactivate_shield(
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Clear shield state
    {
        let mut shield_active = state.is_shield_active.lock().unwrap();
        if !*shield_active {
            return Ok("Shield was not active".to_string());
        }
        *shield_active = false;
    }
    
    // Clear survival DNA (will be replaced by evolved genome)
    {
        let mut active_genome = state.active_genome_id.lock().unwrap();
        if active_genome.as_deref() == Some("SURVIVAL-DNA-V9") {
            *active_genome = None;
        }
    }
    
    tracing::info!("✅ Oracle Shield deactivated. Resuming normal operations.");
    
    Ok("Shield deactivated. Ready to resume evolution cycle.".to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Simulate closing all positions (stub)
async fn simulate_close_positions() -> u32 {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    // Simulate closing 0-5 positions
    let positions_to_close = rng.gen_range(0..6);
    
    for i in 0..positions_to_close {
        tracing::info!("Closing position {}/{}", i + 1, positions_to_close);
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    }
    
    positions_to_close
}

/// Calculate overall market risk score (0.0 - 1.0)
pub fn calculate_risk_score(conditions: &CrisisConditions) -> f64 {
    // Normalize each factor to 0-1 scale
    let vix_score = (conditions.vix_value / 100.0).min(1.0);
    let funding_score = (conditions.funding_rate.abs() * 1000.0).min(1.0);
    let liquidation_score = (conditions.liquidation_volume_24h / 1_000_000_000.0).min(1.0);
    let volatility_score = (conditions.price_change_1m.abs() * 10.0).min(1.0);
    let latency_score = (conditions.exchange_latency_ms as f64 / 2000.0).min(1.0);
    
    // Weighted average
    let risk = 
        0.25 * vix_score +
        0.15 * funding_score +
        0.25 * liquidation_score +
        0.25 * volatility_score +
        0.10 * latency_score;
    
    risk.max(0.0).min(1.0)
}
