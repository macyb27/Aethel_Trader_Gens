/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - T3 NEWS ORACLE
 * Sentiment firehose with LLM-based classification
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { actions } from '../store';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  timestamp: number;
  source: string;
  headline: string;
  summary?: string;
  url?: string;
  symbols: string[];
  categories: string[];
}

export interface SentimentResult {
  score: number;          // -1.0 (bearish) to +1.0 (bullish)
  confidence: number;     // 0.0 to 1.0
  magnitude: number;      // Strength of sentiment
  keywords: string[];     // Key terms extracted
  categories: string[];   // News categories
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SentimentAPIResponse {
  success: boolean;
  sentiment: {
    score: number;
    confidence: number;
    magnitude: number;
  };
  keywords: string[];
  categories: string[];
  impact: string;
  reasoning?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SENTIMENT ANALYZER (LLM API CALLER STUB)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simulates calling DeepSeek/OpenAI API for news classification
 * In production, this would make actual API calls
 */
async function callSentimentAPI(headline: string, summary?: string): Promise<SentimentAPIResponse> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  // Simulated sentiment analysis based on keywords
  const text = `${headline} ${summary || ''}`.toLowerCase();
  
  // Keyword-based scoring (simplified)
  const bullishKeywords = ['rally', 'surge', 'gain', 'bullish', 'up', 'rise', 'growth', 'adoption', 'approval', 'etf', 'institutional'];
  const bearishKeywords = ['crash', 'drop', 'fall', 'bearish', 'down', 'decline', 'hack', 'ban', 'regulation', 'sec', 'lawsuit'];
  const highImpactKeywords = ['breaking', 'urgent', 'flash', 'crash', 'hack', 'etf', 'fed', 'rate', 'halving'];
  
  let bullishCount = 0;
  let bearishCount = 0;
  let impactScore = 0;
  const foundKeywords: string[] = [];
  
  bullishKeywords.forEach(kw => {
    if (text.includes(kw)) {
      bullishCount++;
      foundKeywords.push(kw);
    }
  });
  
  bearishKeywords.forEach(kw => {
    if (text.includes(kw)) {
      bearishCount++;
      foundKeywords.push(kw);
    }
  });
  
  highImpactKeywords.forEach(kw => {
    if (text.includes(kw)) impactScore++;
  });
  
  // Calculate score
  const total = bullishCount + bearishCount;
  let score = 0;
  if (total > 0) {
    score = (bullishCount - bearishCount) / total;
  } else {
    // Random slight bias if no keywords found
    score = (Math.random() - 0.5) * 0.2;
  }
  
  // Calculate confidence based on keyword density
  const confidence = Math.min(0.95, 0.3 + (total / 5) * 0.6);
  
  // Magnitude based on total sentiment keywords
  const magnitude = Math.min(1, total / 4);
  
  // Impact level
  let impact: string;
  if (impactScore >= 2 || magnitude > 0.8) {
    impact = 'CRITICAL';
  } else if (impactScore >= 1 || magnitude > 0.5) {
    impact = 'HIGH';
  } else if (magnitude > 0.3) {
    impact = 'MEDIUM';
  } else {
    impact = 'LOW';
  }
  
  // Categories
  const categories: string[] = [];
  if (text.includes('price') || text.includes('market')) categories.push('MARKET');
  if (text.includes('regulation') || text.includes('sec') || text.includes('law')) categories.push('REGULATORY');
  if (text.includes('hack') || text.includes('security')) categories.push('SECURITY');
  if (text.includes('etf') || text.includes('institutional')) categories.push('INSTITUTIONAL');
  if (text.includes('tech') || text.includes('upgrade')) categories.push('TECHNOLOGY');
  if (categories.length === 0) categories.push('GENERAL');
  
  return {
    success: true,
    sentiment: {
      score,
      confidence,
      magnitude,
    },
    keywords: foundKeywords,
    categories,
    impact,
    reasoning: `Analyzed ${total} sentiment indicators`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWS ORACLE CLASS
// ─────────────────────────────────────────────────────────────────────────────

class NewsOracle {
  private sentimentHistory: SentimentResult[] = [];
  private maxHistory: number = 100;
  private aggregatedSentiment: number = 0;
  private sentimentEMA: number = 0;
  private listeners: Set<(sentiment: number) => void> = new Set();
  
  /**
   * Process a news item and return sentiment analysis
   */
  async analyzeSentiment(news: NewsItem): Promise<SentimentResult> {
    try {
      const response = await callSentimentAPI(news.headline, news.summary);
      
      if (!response.success) {
        throw new Error('Sentiment API failed');
      }
      
      const result: SentimentResult = {
        score: response.sentiment.score,
        confidence: response.sentiment.confidence,
        magnitude: response.sentiment.magnitude,
        keywords: response.keywords,
        categories: response.categories,
        impact: response.impact as SentimentResult['impact'],
      };
      
      // Add to history
      this.sentimentHistory.push(result);
      if (this.sentimentHistory.length > this.maxHistory) {
        this.sentimentHistory.shift();
      }
      
      // Update EMA
      this.updateSentimentEMA(result.score, result.confidence);
      
      // Log significant sentiment
      if (result.impact === 'CRITICAL' || result.impact === 'HIGH') {
        const emoji = result.score > 0 ? '🟢' : result.score < 0 ? '🔴' : '⚪';
        actions.addLog(
          result.score > 0.3 ? 'success' : result.score < -0.3 ? 'error' : 'info',
          'NEWS',
          `${emoji} ${result.impact}: ${news.headline.slice(0, 60)}...`
        );
      }
      
      // Notify listeners
      this.notifyListeners();
      
      return result;
      
    } catch (error) {
      actions.addLog('error', 'NEWS', `Sentiment analysis failed: ${error}`);
      
      // Return neutral result on error
      return {
        score: 0,
        confidence: 0,
        magnitude: 0,
        keywords: [],
        categories: ['ERROR'],
        impact: 'LOW',
      };
    }
  }
  
  private updateSentimentEMA(score: number, confidence: number): void {
    // Confidence-weighted EMA
    const alpha = 0.1 * confidence;
    this.sentimentEMA = alpha * score + (1 - alpha) * this.sentimentEMA;
    this.aggregatedSentiment = this.sentimentEMA;
  }
  
  /**
   * Get current aggregated sentiment score (-1.0 to +1.0)
   * This is used as environmental pressure for genetic algorithm
   */
  getAggregatedSentiment(): number {
    return this.aggregatedSentiment;
  }
  
  /**
   * Get recent sentiment history
   */
  getSentimentHistory(limit: number = 10): SentimentResult[] {
    return this.sentimentHistory.slice(-limit);
  }
  
  /**
   * Calculate sentiment momentum (rate of change)
   */
  getSentimentMomentum(): number {
    if (this.sentimentHistory.length < 5) return 0;
    
    const recent = this.sentimentHistory.slice(-5);
    const older = this.sentimentHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((s, r) => s + r.score, 0) / recent.length;
    const olderAvg = older.length > 0 
      ? older.reduce((s, r) => s + r.score, 0) / older.length 
      : 0;
    
    return recentAvg - olderAvg;
  }
  
  /**
   * Subscribe to sentiment updates
   */
  subscribe(callback: (sentiment: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.aggregatedSentiment));
  }
  
  /**
   * Reset oracle state
   */
  reset(): void {
    this.sentimentHistory = [];
    this.aggregatedSentiment = 0;
    this.sentimentEMA = 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const newsOracle = new NewsOracle();

// ─────────────────────────────────────────────────────────────────────────────
// NEWS FEED SIMULATOR
// ─────────────────────────────────────────────────────────────────────────────

const SIMULATED_HEADLINES = [
  { headline: "Bitcoin ETF sees record inflows as institutional adoption grows", sentiment: 'bullish' },
  { headline: "Major exchange reports $50M hack, user funds at risk", sentiment: 'bearish' },
  { headline: "Fed signals potential rate cut in upcoming meeting", sentiment: 'bullish' },
  { headline: "SEC delays decision on crypto regulatory framework", sentiment: 'bearish' },
  { headline: "Ethereum network upgrade successful, gas fees drop 40%", sentiment: 'bullish' },
  { headline: "Large whale moves 10,000 BTC to exchange wallet", sentiment: 'bearish' },
  { headline: "PayPal expands crypto services to 30 new countries", sentiment: 'bullish' },
  { headline: "Mining difficulty reaches all-time high", sentiment: 'neutral' },
  { headline: "DeFi protocol announces major security vulnerability", sentiment: 'bearish' },
  { headline: "BlackRock increases Bitcoin holdings by 15%", sentiment: 'bullish' },
  { headline: "Regulatory crackdown intensifies in Asia", sentiment: 'bearish' },
  { headline: "Lightning Network capacity surpasses 5,000 BTC", sentiment: 'bullish' },
  { headline: "Market volatility index spikes to yearly high", sentiment: 'neutral' },
  { headline: "Major bank announces crypto custody service launch", sentiment: 'bullish' },
  { headline: "Stablecoin depegs briefly, sparking market concerns", sentiment: 'bearish' },
];

/**
 * Start simulated news feed
 */
export function startNewsFeedSimulation(): () => void {
  const interval = setInterval(async () => {
    // Random chance to generate news
    if (Math.random() > 0.7) {
      const template = SIMULATED_HEADLINES[Math.floor(Math.random() * SIMULATED_HEADLINES.length)];
      
      const news: NewsItem = {
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        source: ['CoinDesk', 'CoinTelegraph', 'Bloomberg', 'Reuters', 'The Block'][Math.floor(Math.random() * 5)],
        headline: template.headline,
        symbols: ['BTC', 'ETH'],
        categories: ['MARKET'],
      };
      
      await newsOracle.analyzeSentiment(news);
    }
  }, 5000); // Check every 5 seconds
  
  return () => clearInterval(interval);
}
