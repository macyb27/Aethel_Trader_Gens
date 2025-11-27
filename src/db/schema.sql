-- ═══════════════════════════════════════════════════════════════════════════
-- ÆTHER-TRADER Ω v4.0 - DATABASE SCHEMA
-- SQLite / Cloudflare D1 Compatible
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- HISTORICAL KLINES (OHLCV Data)
-- High-performance time-series storage for candlestick data
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historical_klines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Timestamp (Unix milliseconds for precision)
    timestamp_ms INTEGER NOT NULL,
    
    -- OHLCV Data (stored as integers for performance, divide by 1e8 for actual price)
    open INTEGER NOT NULL,       -- Price * 1e8
    high INTEGER NOT NULL,       -- Price * 1e8
    low INTEGER NOT NULL,        -- Price * 1e8
    close INTEGER NOT NULL,      -- Price * 1e8
    volume INTEGER NOT NULL,     -- Volume * 1e8
    
    -- Metadata
    exchange TEXT NOT NULL DEFAULT 'BYBIT',  -- BYBIT, BINANCE, etc.
    symbol TEXT NOT NULL DEFAULT 'BTCUSDT',
    interval TEXT NOT NULL DEFAULT '1m',      -- 1m, 5m, 15m, 1h, 4h, 1d
    
    -- Computed metrics (cached for performance)
    vwap INTEGER,               -- Volume Weighted Average Price * 1e8
    trade_count INTEGER,        -- Number of trades in candle
    
    -- Audit
    created_at TEXT DEFAULT (datetime('now')),
    
    -- Composite unique constraint for deduplication
    UNIQUE(exchange, symbol, interval, timestamp_ms)
);

-- Performance indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_klines_lookup 
    ON historical_klines(exchange, symbol, interval, timestamp_ms DESC);
    
CREATE INDEX IF NOT EXISTS idx_klines_time_range 
    ON historical_klines(timestamp_ms);

-- ─────────────────────────────────────────────────────────────────────────────
-- STRATEGY DNA (Genetic Algorithm Genome Storage)
-- Stores evolved strategy configurations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategy_dna (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Genome identification
    genome_id TEXT NOT NULL UNIQUE,           -- UUID v4 for unique identification
    genome_string TEXT NOT NULL,              -- Encoded genome (base64 or hex)
    generation INTEGER NOT NULL DEFAULT 0,    -- Evolution generation number
    
    -- Performance Metrics
    sharpe_ratio REAL NOT NULL DEFAULT 0.0,   -- Risk-adjusted return
    sortino_ratio REAL DEFAULT 0.0,           -- Downside risk-adjusted return
    max_drawdown REAL DEFAULT 0.0,            -- Maximum drawdown percentage
    win_rate REAL DEFAULT 0.0,                -- Winning trade percentage
    profit_factor REAL DEFAULT 0.0,           -- Gross profit / Gross loss
    total_trades INTEGER DEFAULT 0,           -- Number of backtest trades
    
    -- Phenotype Parameters (decoded from genome)
    risk_level REAL DEFAULT 0.5,              -- 0.0 (conservative) to 1.0 (aggressive)
    time_horizon REAL DEFAULT 0.5,            -- 0.0 (scalping) to 1.0 (position)
    trend_bias REAL DEFAULT 0.5,              -- 0.0 (counter-trend) to 1.0 (trend-following)
    volatility_affinity REAL DEFAULT 0.5,     -- 0.0 (low vol) to 1.0 (high vol)
    
    -- Quantum Features
    entanglement_score REAL DEFAULT 0.0,      -- Quantum correlation metric
    last_sentiment REAL DEFAULT 0.0,          -- News sentiment (-1.0 to +1.0)
    
    -- Status
    is_active INTEGER DEFAULT 0,              -- Currently deployed
    is_survival_dna INTEGER DEFAULT 0,        -- Crisis mode genome
    fitness_rank INTEGER DEFAULT 0,           -- Rank in current population
    
    -- Audit
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    backtested_at TEXT
);

-- Indexes for genetic algorithm operations
CREATE INDEX IF NOT EXISTS idx_dna_fitness 
    ON strategy_dna(sharpe_ratio DESC, max_drawdown ASC);
    
CREATE INDEX IF NOT EXISTS idx_dna_generation 
    ON strategy_dna(generation DESC);
    
CREATE INDEX IF NOT EXISTS idx_dna_active 
    ON strategy_dna(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- EVOLUTION HISTORY (Tracks genetic algorithm progress)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evolution_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    generation INTEGER NOT NULL,
    population_size INTEGER NOT NULL,
    
    -- Population Statistics
    best_sharpe REAL NOT NULL,
    avg_sharpe REAL NOT NULL,
    worst_sharpe REAL NOT NULL,
    diversity_score REAL DEFAULT 0.0,         -- Genome diversity metric
    
    -- Evolution Parameters
    mutation_rate REAL NOT NULL,
    crossover_rate REAL NOT NULL,
    selection_pressure REAL NOT NULL,
    
    -- Best genome reference
    best_genome_id TEXT,
    
    -- Timing
    evolved_at TEXT DEFAULT (datetime('now')),
    computation_ms INTEGER                     -- Processing time
);

CREATE INDEX IF NOT EXISTS idx_evolution_gen 
    ON evolution_history(generation DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SENTIMENT FIREHOSE (News & Social Sentiment Scores)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sentiment_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    timestamp_ms INTEGER NOT NULL,
    source TEXT NOT NULL,                     -- 'twitter', 'news', 'reddit', etc.
    symbol TEXT DEFAULT 'BTC',
    
    -- Sentiment Data
    raw_score REAL NOT NULL,                  -- -1.0 to +1.0
    confidence REAL DEFAULT 0.5,              -- Model confidence
    magnitude REAL DEFAULT 0.0,               -- Strength of sentiment
    
    -- Source metadata
    headline TEXT,
    source_url TEXT,
    
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sentiment_time 
    ON sentiment_scores(timestamp_ms DESC);
    
CREATE INDEX IF NOT EXISTS idx_sentiment_source 
    ON sentiment_scores(source, timestamp_ms DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- CRISIS EVENTS (Shield activations and market crashes)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crisis_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    started_at TEXT NOT NULL,
    ended_at TEXT,
    
    -- Crisis metrics
    trigger_type TEXT NOT NULL,               -- 'VIX_SPIKE', 'FUNDING_EXTREME', etc.
    severity REAL NOT NULL,                   -- 0.0 to 1.0
    max_drawdown_during REAL,
    
    -- Shield response
    survival_dna_id TEXT,
    positions_closed INTEGER DEFAULT 0,
    
    -- Outcome
    outcome TEXT,                             -- 'SURVIVED', 'PARTIAL_LOSS', etc.
    pnl_during REAL
);

CREATE INDEX IF NOT EXISTS idx_crisis_time 
    ON crisis_events(started_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRADE LOG (Execution history)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Trade identification
    trade_id TEXT NOT NULL UNIQUE,
    order_id TEXT,
    
    -- Trade details
    timestamp_ms INTEGER NOT NULL,
    exchange TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,                       -- 'BUY', 'SELL'
    order_type TEXT NOT NULL,                 -- 'MARKET', 'LIMIT', etc.
    
    -- Quantities
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    fee REAL DEFAULT 0.0,
    
    -- Strategy reference
    genome_id TEXT,
    signal_source TEXT,                       -- Which feature triggered
    
    -- Status
    status TEXT DEFAULT 'FILLED',
    
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trade_time 
    ON trade_log(timestamp_ms DESC);
    
CREATE INDEX IF NOT EXISTS idx_trade_genome 
    ON trade_log(genome_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Pre-seed Survival DNA (Crisis Mode Default)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO strategy_dna (
    genome_id,
    genome_string,
    generation,
    sharpe_ratio,
    max_drawdown,
    risk_level,
    time_horizon,
    trend_bias,
    volatility_affinity,
    is_survival_dna
) VALUES (
    'SURVIVAL-DNA-V9',
    'U1VSVklWQUwtREVMVEEtTkVVVFJBTC1NT0RF',  -- Base64: "SURVIVAL-DELTA-NEUTRAL-MODE"
    0,
    0.5,
    0.05,
    0.1,   -- Very conservative risk
    0.8,   -- Long time horizon
    0.5,   -- Neutral trend
    0.2,   -- Low volatility preference
    1      -- Is survival DNA
);
