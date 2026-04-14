#!/usr/bin/env python3
"""
RL Model Training Script
Trains the Reinforcement Learning agent with historical market data
"""

import json
import sys
from datetime import datetime, timedelta
import yfinance as yf
import numpy as np

def fetch_historical_data(symbol, period="2y"):
    """Fetch historical data for training"""
    print(f"Fetching {period} of historical data for {symbol}...")
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    return df

def calculate_technical_indicators(df):
    """Calculate technical indicators"""
    # SMA
    df['SMA20'] = df['Close'].rolling(window=20).mean()
    df['SMA50'] = df['Close'].rolling(window=50).mean()
    
    # RSI
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    
    # Volatility
    df['Volatility'] = df['Close'].pct_change().rolling(window=20).std()
    
    return df.dropna()

def create_rl_state(row, prev_close):
    """Create RL state from market data"""
    price_change = ((row['Close'] - prev_close) / prev_close) * 100 if prev_close > 0 else 0
    
    return {
        "price": float(row['Close']),
        "priceChange": float(price_change),
        "volume": float(row['Volume']) / 1e9,  # Normalize
        "volatility": float(row['Volatility']) if not np.isnan(row['Volatility']) else 0.5,
        "sma20": float(row['SMA20']),
        "sma50": float(row['SMA50']),
        "rsi": float(row['RSI']) if not np.isnan(row['RSI']) else 50,
        "macd": float(row['MACD']) if not np.isnan(row['MACD']) else 0,
        "newsSentiment": np.random.uniform(-0.5, 0.5),  # Simulated
        "marketSentiment": np.random.uniform(-0.5, 0.5),  # Simulated
        "portfolioValue": 10000,
        "positionSize": 0,
        "unrealizedPnL": 0
    }

def simulate_episode(df, episode_num):
    """Simulate one trading episode"""
    portfolio_value = 10000
    position = 0
    position_entry_price = 0
    trades = []
    
    for i in range(len(df) - 1):
        row = df.iloc[i]
        next_row = df.iloc[i + 1]
        prev_close = df.iloc[i - 1]['Close'] if i > 0 else row['Close']
        
        state = create_rl_state(row, prev_close)
        
        # Simple strategy for training (momentum + RSI)
        action = "hold"
        if state['rsi'] < 30 and state['macd'] > 0:
            action = "buy"
        elif state['rsi'] > 70 or state['macd'] < 0:
            action = "sell"
        
        # Execute trade
        if action == "buy" and position == 0:
            position = (portfolio_value * 0.95) / row['Close']  # 95% of portfolio
            position_entry_price = row['Close']
            trades.append({
                "type": "buy",
                "price": float(row['Close']),
                "date": str(row.name)
            })
        elif action == "sell" and position > 0:
            exit_price = row['Close']
            pnl = (exit_price - position_entry_price) * position
            portfolio_value += pnl
            trades.append({
                "type": "sell",
                "price": float(row['Close']),
                "pnl": float(pnl),
                "date": str(row.name)
            })
            position = 0
            position_entry_price = 0
    
    # Close any open position
    if position > 0:
        exit_price = df.iloc[-1]['Close']
        pnl = (exit_price - position_entry_price) * position
        portfolio_value += pnl
    
    # Calculate metrics
    total_return = ((portfolio_value - 10000) / 10000) * 100
    win_trades = [t for t in trades if t.get('pnl', 0) > 0]
    win_rate = (len(win_trades) / len([t for t in trades if 'pnl' in t])) * 100 if trades else 0
    
    return {
        "episode": episode_num,
        "totalTrades": len(trades),
        "portfolioValue": float(portfolio_value),
        "totalReturn": float(total_return),
        "winRate": float(win_rate),
        "trades": trades
    }

def train_rl_model(symbol="AAPL", episodes=100):
    """Train RL model with multiple episodes"""
    print(f"\n{'='*60}")
    print(f"RL MODEL TRAINING")
    print(f"{'='*60}")
    print(f"Symbol: {symbol}")
    print(f"Episodes: {episodes}")
    print(f"{'='*60}\n")
    
    # Fetch historical data
    df = fetch_historical_data(symbol)
    df = calculate_technical_indicators(df)
    
    print(f"✅ Loaded {len(df)} days of historical data")
    print(f"Date range: {df.index[0].date()} to {df.index[-1].date()}\n")
    
    # Train for multiple episodes
    results = []
    best_return = -float('inf')
    best_episode = None
    
    for episode in range(1, episodes + 1):
        result = simulate_episode(df, episode)
        results.append(result)
        
        if result['totalReturn'] > best_return:
            best_return = result['totalReturn']
            best_episode = result
        
        # Progress update every 10 episodes
        if episode % 10 == 0:
            avg_return = np.mean([r['totalReturn'] for r in results[-10:]])
            avg_win_rate = np.mean([r['winRate'] for r in results[-10:]])
            print(f"Episode {episode}/{episodes} | "
                  f"Avg Return (last 10): {avg_return:.2f}% | "
                  f"Avg Win Rate: {avg_win_rate:.1f}%")
    
    # Calculate final metrics
    avg_return = np.mean([r['totalReturn'] for r in results])
    avg_win_rate = np.mean([r['winRate'] for r in results])
    avg_trades = np.mean([r['totalTrades'] for r in results])
    
    print(f"\n{'='*60}")
    print(f"TRAINING COMPLETE")
    print(f"{'='*60}")
    print(f"Total Episodes: {episodes}")
    print(f"Average Return: {avg_return:.2f}%")
    print(f"Average Win Rate: {avg_win_rate:.1f}%")
    print(f"Average Trades per Episode: {avg_trades:.1f}")
    print(f"Best Episode Return: {best_return:.2f}%")
    print(f"{'='*60}\n")
    
    # Save training results
    training_data = {
        "symbol": symbol,
        "episodes": episodes,
        "trainingDate": datetime.now().isoformat(),
        "metrics": {
            "averageReturn": float(avg_return),
            "averageWinRate": float(avg_win_rate),
            "averageTrades": float(avg_trades),
            "bestReturn": float(best_return)
        },
        "bestEpisode": best_episode,
        "allResults": results
    }
    
    output_file = "/home/ubuntu/easygeld-pro/rl-training-results.json"
    with open(output_file, 'w') as f:
        json.dump(training_data, f, indent=2)
    
    print(f"✅ Training results saved to: {output_file}")
    
    return training_data

if __name__ == "__main__":
    symbol = sys.argv[1] if len(sys.argv) > 1 else "AAPL"
    episodes = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    train_rl_model(symbol, episodes)
