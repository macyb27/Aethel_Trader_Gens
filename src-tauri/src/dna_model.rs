//! ═══════════════════════════════════════════════════════════════════════════
//! ÆTHER-TRADER Ω v4.0 - STRATEGY DNA MODEL
//! Genetic representation of trading strategies
//! ═══════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Core Strategy DNA structure
/// Represents a complete trading strategy genome
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyDNA {
    /// Unique identifier for this genome
    pub genome_id: String,
    
    /// Encoded genome string (base64)
    pub genome_string: String,
    
    /// Evolution generation number
    pub generation: u32,
    
    // ─────────────────────────────────────────────────────────────────────────
    // PERFORMANCE METRICS
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Risk-adjusted return (higher is better)
    pub sharpe_ratio: f64,
    
    /// Downside risk-adjusted return
    pub sortino_ratio: f64,
    
    /// Maximum drawdown percentage (0.0 to 1.0)
    pub max_drawdown: f64,
    
    /// Percentage of winning trades
    pub win_rate: f64,
    
    /// Gross profit / Gross loss
    pub profit_factor: f64,
    
    /// Total number of trades in backtest
    pub total_trades: u32,
    
    // ─────────────────────────────────────────────────────────────────────────
    // PHENOTYPE PARAMETERS (decoded from genome)
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Risk tolerance: 0.0 (conservative) to 1.0 (aggressive)
    pub risk_level: f64,
    
    /// Trading frequency: 0.0 (scalping) to 1.0 (position trading)
    pub time_horizon: f64,
    
    /// Trend following vs contrarian: 0.0 (counter-trend) to 1.0 (trend-following)
    pub trend_bias: f64,
    
    /// Volatility preference: 0.0 (low vol) to 1.0 (high vol)
    pub volatility_affinity: f64,
    
    // ─────────────────────────────────────────────────────────────────────────
    // QUANTUM & EXTERNAL FEATURES
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Quantum correlation metric from orderflow analysis
    pub entanglement_score: f64,
    
    /// Latest news sentiment score (-1.0 to +1.0)
    pub last_sentiment: f32,
    
    // ─────────────────────────────────────────────────────────────────────────
    // STATUS FLAGS
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Currently deployed as active strategy
    pub is_active: bool,
    
    /// Special crisis-mode genome
    pub is_survival_dna: bool,
    
    /// Rank in current population (1 = best)
    pub fitness_rank: u32,
    
    // ─────────────────────────────────────────────────────────────────────────
    // TIMESTAMPS
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Creation timestamp (ISO 8601)
    pub created_at: String,
    
    /// Last update timestamp
    pub updated_at: String,
    
    /// Last backtest timestamp
    pub backtested_at: Option<String>,
}

impl Default for StrategyDNA {
    fn default() -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        
        Self {
            genome_id: Uuid::new_v4().to_string(),
            genome_string: String::new(),
            generation: 0,
            sharpe_ratio: 0.0,
            sortino_ratio: 0.0,
            max_drawdown: 0.0,
            win_rate: 0.0,
            profit_factor: 0.0,
            total_trades: 0,
            risk_level: 0.5,
            time_horizon: 0.5,
            trend_bias: 0.5,
            volatility_affinity: 0.5,
            entanglement_score: 0.0,
            last_sentiment: 0.0,
            is_active: false,
            is_survival_dna: false,
            fitness_rank: 0,
            created_at: now.clone(),
            updated_at: now,
            backtested_at: None,
        }
    }
}

impl StrategyDNA {
    /// Create a new random genome
    pub fn new_random() -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let mut dna = Self::default();
        dna.risk_level = rng.gen_range(0.0..1.0);
        dna.time_horizon = rng.gen_range(0.0..1.0);
        dna.trend_bias = rng.gen_range(0.0..1.0);
        dna.volatility_affinity = rng.gen_range(0.0..1.0);
        
        // Encode phenotype to genome string
        dna.genome_string = dna.encode_genome();
        
        dna
    }
    
    /// Encode phenotype parameters to genome string
    pub fn encode_genome(&self) -> String {
        let raw = format!(
            "R{:.4}H{:.4}T{:.4}V{:.4}E{:.4}S{:.4}",
            self.risk_level,
            self.time_horizon,
            self.trend_bias,
            self.volatility_affinity,
            self.entanglement_score,
            self.last_sentiment
        );
        base64::encode(&raw)
    }
    
    /// Decode genome string to phenotype parameters
    pub fn decode_genome(genome_string: &str) -> Result<(f64, f64, f64, f64), String> {
        let decoded = base64::decode(genome_string)
            .map_err(|e| format!("Base64 decode error: {}", e))?;
        
        let raw = String::from_utf8(decoded)
            .map_err(|e| format!("UTF-8 decode error: {}", e))?;
        
        // Parse: R0.5000H0.5000T0.5000V0.5000E0.0000S0.0000
        let parts: Vec<&str> = raw.split(|c| c == 'R' || c == 'H' || c == 'T' || c == 'V' || c == 'E' || c == 'S')
            .filter(|s| !s.is_empty())
            .collect();
        
        if parts.len() < 4 {
            return Err("Invalid genome format".to_string());
        }
        
        Ok((
            parts[0].parse().unwrap_or(0.5),
            parts[1].parse().unwrap_or(0.5),
            parts[2].parse().unwrap_or(0.5),
            parts[3].parse().unwrap_or(0.5),
        ))
    }
    
    /// Calculate fitness score (composite of all metrics)
    pub fn calculate_fitness(&self) -> f64 {
        // Weighted fitness formula:
        // - Sharpe ratio is primary (weight: 0.4)
        // - Sortino ratio (weight: 0.2) 
        // - Max drawdown penalty (weight: 0.2)
        // - Win rate bonus (weight: 0.1)
        // - Profit factor bonus (weight: 0.1)
        
        let sharpe_score = self.sharpe_ratio.max(-2.0).min(4.0) / 4.0; // Normalize to 0-1
        let sortino_score = self.sortino_ratio.max(-2.0).min(4.0) / 4.0;
        let drawdown_penalty = 1.0 - self.max_drawdown.min(1.0);
        let win_rate_score = self.win_rate;
        let profit_factor_score = (self.profit_factor.min(3.0) / 3.0);
        
        let fitness = 
            0.4 * sharpe_score +
            0.2 * sortino_score +
            0.2 * drawdown_penalty +
            0.1 * win_rate_score +
            0.1 * profit_factor_score;
        
        fitness.max(0.0).min(1.0)
    }
    
    /// Create survival DNA (delta-neutral crisis mode)
    pub fn survival_dna() -> Self {
        Self {
            genome_id: "SURVIVAL-DNA-V9".to_string(),
            genome_string: base64::encode("SURVIVAL-DELTA-NEUTRAL-MODE"),
            generation: 0,
            sharpe_ratio: 0.5,
            sortino_ratio: 0.5,
            max_drawdown: 0.05,
            win_rate: 0.6,
            profit_factor: 1.5,
            total_trades: 0,
            risk_level: 0.1,      // Very conservative
            time_horizon: 0.8,    // Long-term focus
            trend_bias: 0.5,      // Market neutral
            volatility_affinity: 0.2, // Avoid high vol
            entanglement_score: 0.0,
            last_sentiment: 0.0,
            is_active: false,
            is_survival_dna: true,
            fitness_rank: 0,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            backtested_at: None,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GENETIC OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/// Crossover two parent genomes to create offspring
pub fn crossover(parent_a: &StrategyDNA, parent_b: &StrategyDNA) -> StrategyDNA {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    let mut child = StrategyDNA::default();
    
    // Single-point crossover for each phenotype parameter
    child.risk_level = if rng.gen_bool(0.5) { parent_a.risk_level } else { parent_b.risk_level };
    child.time_horizon = if rng.gen_bool(0.5) { parent_a.time_horizon } else { parent_b.time_horizon };
    child.trend_bias = if rng.gen_bool(0.5) { parent_a.trend_bias } else { parent_b.trend_bias };
    child.volatility_affinity = if rng.gen_bool(0.5) { parent_a.volatility_affinity } else { parent_b.volatility_affinity };
    
    // Inherit generation (max of parents + 1)
    child.generation = parent_a.generation.max(parent_b.generation) + 1;
    
    // Encode new genome
    child.genome_string = child.encode_genome();
    
    child
}

/// Mutate a genome with given mutation rate
pub fn mutate(dna: &mut StrategyDNA, mutation_rate: f64) {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    let mutation_strength = 0.1; // Max mutation delta
    
    // Mutate each parameter with probability = mutation_rate
    if rng.gen_bool(mutation_rate) {
        dna.risk_level = (dna.risk_level + rng.gen_range(-mutation_strength..mutation_strength))
            .max(0.0).min(1.0);
    }
    if rng.gen_bool(mutation_rate) {
        dna.time_horizon = (dna.time_horizon + rng.gen_range(-mutation_strength..mutation_strength))
            .max(0.0).min(1.0);
    }
    if rng.gen_bool(mutation_rate) {
        dna.trend_bias = (dna.trend_bias + rng.gen_range(-mutation_strength..mutation_strength))
            .max(0.0).min(1.0);
    }
    if rng.gen_bool(mutation_rate) {
        dna.volatility_affinity = (dna.volatility_affinity + rng.gen_range(-mutation_strength..mutation_strength))
            .max(0.0).min(1.0);
    }
    
    // Re-encode genome after mutation
    dna.genome_string = dna.encode_genome();
    dna.updated_at = chrono::Utc::now().to_rfc3339();
}

/// Select best genomes from population (tournament selection)
pub fn select(
    population: &[StrategyDNA], 
    count: usize, 
    user_bias: Option<(f64, f64)>, // Optional phenotype bias from user GSM selection
) -> Vec<StrategyDNA> {
    use rand::seq::SliceRandom;
    let mut rng = rand::thread_rng();
    
    let mut selected = Vec::with_capacity(count);
    let tournament_size = 3;
    
    for _ in 0..count {
        // Random tournament
        let mut tournament: Vec<&StrategyDNA> = population
            .choose_multiple(&mut rng, tournament_size)
            .collect();
        
        // Sort by fitness (considering user bias if present)
        tournament.sort_by(|a, b| {
            let fitness_a = calculate_biased_fitness(a, user_bias);
            let fitness_b = calculate_biased_fitness(b, user_bias);
            fitness_b.partial_cmp(&fitness_a).unwrap()
        });
        
        if let Some(winner) = tournament.first() {
            selected.push((*winner).clone());
        }
    }
    
    selected
}

/// Calculate fitness with optional user phenotype bias
fn calculate_biased_fitness(dna: &StrategyDNA, user_bias: Option<(f64, f64)>) -> f64 {
    let base_fitness = dna.calculate_fitness();
    
    if let Some((target_x, target_y)) = user_bias {
        // Calculate distance from user-selected point in phenotype space
        // X = risk_level, Y = time_horizon (simplified 2D mapping)
        let distance = ((dna.risk_level - target_x).powi(2) + (dna.time_horizon - target_y).powi(2)).sqrt();
        
        // Proximity bonus: closer to user selection = higher fitness
        // Max distance in unit square = sqrt(2) ≈ 1.414
        let proximity_bonus = 1.0 - (distance / 1.414);
        
        // Blend: 70% base fitness + 30% proximity to user selection
        // This gives user's visual input significant evolutionary pressure
        0.7 * base_fitness + 0.3 * proximity_bonus
    } else {
        base_fitness
    }
}
