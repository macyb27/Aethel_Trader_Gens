//! ═══════════════════════════════════════════════════════════════════════════
//! ÆTHER-TRADER Ω v4.0 - TAURI COMMANDS
//! WebSocket connections and phenotype control
//! ═══════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use crate::{NormalizedTrade, NormalizedKline};

// ─────────────────────────────────────────────────────────────────────────────
// PHENOTYPE BIAS
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhenotypeBias {
    pub risk_level: f64,
    pub time_horizon: f64,
    pub trend_bias: f64,
    pub volatility_affinity: f64,
}

impl Default for PhenotypeBias {
    fn default() -> Self {
        Self {
            risk_level: 0.5,
            time_horizon: 0.5,
            trend_bias: 0.5,
            volatility_affinity: 0.5,
        }
    }
}

/// Set phenotype bias from user input (DNA Control Panel)
#[tauri::command]
pub async fn set_phenotype_bias(bias: PhenotypeBias) -> Result<String, String> {
    // Validate input ranges
    if bias.risk_level < 0.0 || bias.risk_level > 1.0 {
        return Err("Risk level must be between 0.0 and 1.0".to_string());
    }
    if bias.time_horizon < 0.0 || bias.time_horizon > 1.0 {
        return Err("Time horizon must be between 0.0 and 1.0".to_string());
    }
    if bias.trend_bias < 0.0 || bias.trend_bias > 1.0 {
        return Err("Trend bias must be between 0.0 and 1.0".to_string());
    }
    if bias.volatility_affinity < 0.0 || bias.volatility_affinity > 1.0 {
        return Err("Volatility affinity must be between 0.0 and 1.0".to_string());
    }
    
    tracing::info!(
        "Phenotype bias updated: risk={:.2}, horizon={:.2}, trend={:.2}, vol={:.2}",
        bias.risk_level,
        bias.time_horizon,
        bias.trend_bias,
        bias.volatility_affinity
    );
    
    // In production, this would trigger GA selection pressure update
    Ok(format!(
        "Phenotype bias set: R={:.2} H={:.2} T={:.2} V={:.2}",
        bias.risk_level,
        bias.time_horizon,
        bias.trend_bias,
        bias.volatility_affinity
    ))
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET STUBS
// ─────────────────────────────────────────────────────────────────────────────

/// Start Bybit WebSocket connection (stub)
#[tauri::command]
pub async fn start_bybit_ws(symbols: Vec<String>) -> Result<String, String> {
    tracing::info!("Starting Bybit WebSocket for symbols: {:?}", symbols);
    
    // Stub: In production, this would establish real WebSocket connection
    // using tokio-tungstenite to wss://stream.bybit.com/v5/public/linear
    
    // Simulate connection success
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    Ok(format!("Bybit WebSocket connected for {} symbols", symbols.len()))
}

/// Start Binance WebSocket connection (stub)
#[tauri::command]
pub async fn start_binance_ws(symbols: Vec<String>) -> Result<String, String> {
    tracing::info!("Starting Binance WebSocket for symbols: {:?}", symbols);
    
    // Stub: In production, this would establish real WebSocket connection
    // using tokio-tungstenite to wss://stream.binance.com:9443/ws
    
    // Simulate connection success
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    Ok(format!("Binance WebSocket connected for {} symbols", symbols.len()))
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA NORMALIZATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/// Normalize Bybit trade data to common format
pub fn normalize_bybit_trade(raw: serde_json::Value) -> Result<NormalizedTrade, String> {
    // Example Bybit trade structure
    Ok(NormalizedTrade {
        id: raw["i"].as_str().unwrap_or("").to_string(),
        timestamp_ms: raw["T"].as_i64().unwrap_or(0),
        exchange: "BYBIT".to_string(),
        symbol: raw["s"].as_str().unwrap_or("").to_string(),
        side: raw["S"].as_str().unwrap_or("").to_string(),
        price: raw["p"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        quantity: raw["v"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        is_maker: raw["m"].as_bool().unwrap_or(false),
    })
}

/// Normalize Binance trade data to common format
pub fn normalize_binance_trade(raw: serde_json::Value) -> Result<NormalizedTrade, String> {
    Ok(NormalizedTrade {
        id: raw["t"].as_i64().map(|v| v.to_string()).unwrap_or_default(),
        timestamp_ms: raw["T"].as_i64().unwrap_or(0),
        exchange: "BINANCE".to_string(),
        symbol: raw["s"].as_str().unwrap_or("").to_string(),
        side: if raw["m"].as_bool().unwrap_or(false) { "SELL" } else { "BUY" }.to_string(),
        price: raw["p"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        quantity: raw["q"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        is_maker: raw["m"].as_bool().unwrap_or(false),
    })
}

/// Normalize Bybit kline data
pub fn normalize_bybit_kline(raw: serde_json::Value, symbol: &str, interval: &str) -> Result<NormalizedKline, String> {
    Ok(NormalizedKline {
        timestamp_ms: raw["start"].as_i64().unwrap_or(0),
        exchange: "BYBIT".to_string(),
        symbol: symbol.to_string(),
        interval: interval.to_string(),
        open: raw["open"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        high: raw["high"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        low: raw["low"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        close: raw["close"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        volume: raw["volume"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        trade_count: None,
        vwap: None,
    })
}

/// Normalize Binance kline data
pub fn normalize_binance_kline(raw: &[serde_json::Value], symbol: &str, interval: &str) -> Result<NormalizedKline, String> {
    if raw.len() < 12 {
        return Err("Invalid Binance kline data".to_string());
    }
    
    Ok(NormalizedKline {
        timestamp_ms: raw[0].as_i64().unwrap_or(0),
        exchange: "BINANCE".to_string(),
        symbol: symbol.to_string(),
        interval: interval.to_string(),
        open: raw[1].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        high: raw[2].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        low: raw[3].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        close: raw[4].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        volume: raw[5].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        trade_count: raw[8].as_i64(),
        vwap: None, // Calculate if needed
    })
}
