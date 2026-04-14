//! ═══════════════════════════════════════════════════════════════════════════
//! ÆTHER-TRADER Ω v4.0 - RUST BACKEND CORE
//! Self-Aware Market Oracle with Quantum-Inspired Trading Intelligence
//! ═══════════════════════════════════════════════════════════════════════════

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

mod commands;
mod dna_model;
mod shield_logic;

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Normalized trade data structure for multi-exchange compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedTrade {
    pub id: String,
    pub timestamp_ms: i64,
    pub exchange: String,
    pub symbol: String,
    pub side: String,        // "BUY" or "SELL"
    pub price: f64,
    pub quantity: f64,
    pub is_maker: bool,
}

/// Normalized kline (candlestick) data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedKline {
    pub timestamp_ms: i64,
    pub exchange: String,
    pub symbol: String,
    pub interval: String,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
    pub trade_count: Option<i64>,
    pub vwap: Option<f64>,
}

/// Application state container
pub struct AppState {
    pub db_path: String,
    pub is_shield_active: Mutex<bool>,
    pub active_genome_id: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            db_path: "aether_trader.db".to_string(),
            is_shield_active: Mutex::new(false),
            active_genome_id: Mutex::new(None),
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAURI COMMANDS
// ─────────────────────────────────────────────────────────────────────────────

/// Get environment variable securely
#[tauri::command]
fn get_env_var(key: &str) -> Result<String, String> {
    std::env::var(key).map_err(|_| format!("Environment variable {} not found", key))
}

/// Initialize the oracle system
#[tauri::command]
async fn initialize_oracle(state: State<'_, AppState>) -> Result<String, String> {
    // Initialize database connection
    tracing::info!("Initializing ÆTHER-TRADER Ω Oracle...");
    
    // Generate session ID
    let session_id = Uuid::new_v4().to_string();
    
    Ok(session_id)
}

/// Spawn trading agents (simulated)
#[tauri::command]
async fn spawn_agents(count: u32) -> Result<Vec<String>, String> {
    let mut agent_ids = Vec::with_capacity(count as usize);
    
    for i in 0..count {
        let agent_id = format!("AGENT-{:04}-{}", i, Uuid::new_v4().to_string()[..8].to_uppercase());
        agent_ids.push(agent_id);
        
        // Simulate agent initialization delay
        if i % 50 == 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        }
    }
    
    tracing::info!("Spawned {} trading agents", count);
    Ok(agent_ids)
}

/// Get current market data (stub)
#[tauri::command]
async fn get_market_data(symbol: &str) -> Result<NormalizedKline, String> {
    // Stub implementation - will be replaced with real WebSocket data
    Ok(NormalizedKline {
        timestamp_ms: chrono::Utc::now().timestamp_millis(),
        exchange: "SIMULATED".to_string(),
        symbol: symbol.to_string(),
        interval: "1m".to_string(),
        open: 42000.0,
        high: 42100.0,
        low: 41900.0,
        close: 42050.0,
        volume: 1234.56,
        trade_count: Some(1000),
        vwap: Some(42025.0),
    })
}

/// Check oracle health status
#[tauri::command]
fn get_oracle_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let shield_active = *state.is_shield_active.lock().unwrap();
    let active_genome = state.active_genome_id.lock().unwrap().clone();
    
    Ok(serde_json::json!({
        "status": if shield_active { "survival" } else { "active" },
        "shield_active": shield_active,
        "active_genome": active_genome,
        "timestamp": chrono::Utc::now().timestamp_millis()
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION ENTRY
// ─────────────────────────────────────────────────────────────────────────────

fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();
    
    // Load environment variables
    dotenvy::dotenv().ok();
    
    tracing::info!("═══════════════════════════════════════════════════════════");
    tracing::info!("  ÆTHER-TRADER Ω v4.0 - Self-Aware Market Oracle");
    tracing::info!("═══════════════════════════════════════════════════════════");
    
    // Build Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_env_var,
            initialize_oracle,
            spawn_agents,
            get_market_data,
            get_oracle_status,
            commands::start_bybit_ws,
            commands::start_binance_ws,
            commands::set_phenotype_bias,
            shield_logic::check_crisis_conditions,
            shield_logic::activate_shield,
            shield_logic::deactivate_shield,
        ])
        .run(tauri::generate_context!())
        .expect("Error running ÆTHER-TRADER Ω");
}
