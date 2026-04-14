import { describe, it, expect } from "vitest";
import { getAlpacaAPI } from "./alpaca-api";
import { getFinnhubAPI } from "./finnhub-api";

describe("API Services Validation", () => {
  it("should validate Alpaca API connection", async () => {
    const alpaca = getAlpacaAPI();
    const isValid = await alpaca.validateConnection();
    expect(isValid).toBe(true);
  }, 10000);

  it("should validate Finnhub API connection", async () => {
    const finnhub = getFinnhubAPI();
    const isValid = await finnhub.validateConnection();
    expect(isValid).toBe(true);
  }, 10000);

  it("should fetch Alpaca account information", async () => {
    const alpaca = getAlpacaAPI();
    const account = await alpaca.getAccount();
    
    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(account.currency).toBe("USD");
    expect(parseFloat(account.cash)).toBeGreaterThanOrEqual(0);
  }, 10000);

  it("should fetch current price from Alpaca", async () => {
    const alpaca = getAlpacaAPI();
    const price = await alpaca.getCurrentPrice("AAPL");
    
    expect(price).toBeGreaterThan(0);
    expect(typeof price).toBe("number");
  }, 10000);

  it("should fetch quote from Finnhub", async () => {
    const finnhub = getFinnhubAPI();
    const quote = await finnhub.getQuote("AAPL");
    
    expect(quote).toBeDefined();
    expect(quote.c).toBeGreaterThan(0); // Current price
    expect(typeof quote.dp).toBe("number"); // Percent change
  }, 10000);

  it("should fetch market news from Finnhub", async () => {
    const finnhub = getFinnhubAPI();
    const news = await finnhub.getMarketNews("general");
    
    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
    
    if (news.length > 0) {
      expect(news[0].headline).toBeDefined();
      expect(news[0].source).toBeDefined();
    }
  }, 10000);

  it("should fetch news sentiment from Finnhub", async () => {
    const finnhub = getFinnhubAPI();
    const sentiment = await finnhub.getNewsSentiment("AAPL");
    
    expect(sentiment).toBeDefined();
    expect(sentiment.symbol).toBe("AAPL");
    expect(sentiment.score).toBeGreaterThanOrEqual(-1);
    expect(sentiment.score).toBeLessThanOrEqual(1);
  }, 10000);

  it("should check if market is open", async () => {
    const alpaca = getAlpacaAPI();
    const isOpen = await alpaca.isMarketOpen();
    
    expect(typeof isOpen).toBe("boolean");
  }, 10000);
});
