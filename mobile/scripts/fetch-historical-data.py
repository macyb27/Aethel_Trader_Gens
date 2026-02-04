#!/usr/bin/env python3
"""
Historical Data Fetcher using yfinance

Fetches historical OHLCV data for backtesting purposes.
Usage: python3 fetch-historical-data.py <symbol> <period> <interval>
Example: python3 fetch-historical-data.py AAPL 2y 1d
"""

import sys
import json
import yfinance as yf
from datetime import datetime

def fetch_historical_data(symbol, period="2y", interval="1d"):
    """
    Fetch historical data for a symbol
    
    Args:
        symbol: Stock symbol (e.g., "AAPL")
        period: Data period (1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max)
        interval: Data interval (1m,2m,5m,15m,30m,60m,90m,1h,1d,5d,1wk,1mo,3mo)
    
    Returns:
        JSON string with historical data
    """
    try:
        ticker = yf.Ticker(symbol)
        
        # Fetch historical data
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            return json.dumps({
                "success": False,
                "error": f"No data found for symbol {symbol}"
            })
        
        # Convert to list of dicts
        data = []
        for index, row in hist.iterrows():
            data.append({
                "timestamp": index.isoformat(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"]),
            })
        
        # Get ticker info
        info = ticker.info
        
        result = {
            "success": True,
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "data_points": len(data),
            "start_date": data[0]["timestamp"] if data else None,
            "end_date": data[-1]["timestamp"] if data else None,
            "current_price": info.get("currentPrice", data[-1]["close"] if data else None),
            "market_cap": info.get("marketCap"),
            "company_name": info.get("longName", info.get("shortName")),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "data": data
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: fetch-historical-data.py <symbol> [period] [interval]"
        }))
        sys.exit(1)
    
    symbol = sys.argv[1].upper()
    period = sys.argv[2] if len(sys.argv) > 2 else "2y"
    interval = sys.argv[3] if len(sys.argv) > 3 else "1d"
    
    result = fetch_historical_data(symbol, period, interval)
    print(result)

if __name__ == "__main__":
    main()
