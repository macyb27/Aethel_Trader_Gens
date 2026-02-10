/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ÆTHER-TRADER Ω v4.0 - T3 NEWS ORACLE
 * Sentiment firehose with LLM-based classification
 * Supports real API calls via edge functions
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { actions } from '../store';
import { fetchNews, analyzeSentiment as apiAnalyzeSentiment } from '../services/api';
import { authState } from '../store/auth';

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
  score: number;
  confidence: number;
  magnitude: number;
  keywords: string[];
  categories: string[];
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

function fallbackSentimentAnalysis(headline: string, summary?: string): SentimentAPIResponse {
  const text = `${headline} ${summary || ''}`.toLowerCase();

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

  const total = bullishCount + bearishCount;
  let score = 0;
  if (total > 0) {
    score = (bullishCount - bearishCount) / total;
  } else {
    score = (Math.random() - 0.5) * 0.2;
  }

  const confidence = Math.min(0.95, 0.3 + (total / 5) * 0.6);
  const magnitude = Math.min(1, total / 4);

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

  const categories: string[] = [];
  if (text.includes('price') || text.includes('market')) categories.push('MARKET');
  if (text.includes('regulation') || text.includes('sec') || text.includes('law')) categories.push('REGULATORY');
  if (text.includes('hack') || text.includes('security')) categories.push('SECURITY');
  if (text.includes('etf') || text.includes('institutional')) categories.push('INSTITUTIONAL');
  if (text.includes('tech') || text.includes('upgrade')) categories.push('TECHNOLOGY');
  if (categories.length === 0) categories.push('GENERAL');

  return {
    success: true,
    sentiment: { score, confidence, magnitude },
    keywords: foundKeywords,
    categories,
    impact,
    reasoning: `Analyzed ${total} sentiment indicators`,
  };
}

class NewsOracle {
  private sentimentHistory: SentimentResult[] = [];
  private maxHistory: number = 100;
  private aggregatedSentiment: number = 0;
  private sentimentEMA: number = 0;
  private listeners: Set<(sentiment: number) => void> = new Set();
  private isRealMode: boolean = false;
  private cachedNews: NewsItem[] = [];

  setRealMode(enabled: boolean): void {
    this.isRealMode = enabled;
    if (enabled) {
      actions.addLog('success', 'NEWS', 'Switched to REAL API mode for sentiment analysis');
    } else {
      actions.addLog('info', 'NEWS', 'Switched to SIMULATED mode for sentiment analysis');
    }
  }

  hasRealApiKeys(): boolean {
    const hasNewsApi = authState.apiKeys.some(k => k.provider === 'NEWS_API' && k.isActive);
    const hasLlmApi = authState.apiKeys.some(
      k => (k.provider === 'OPENAI' || k.provider === 'DEEPSEEK') && k.isActive
    );
    return hasNewsApi || hasLlmApi;
  }

  async analyzeSentiment(news: NewsItem): Promise<SentimentResult> {
    try {
      let response: SentimentAPIResponse;

      if (this.isRealMode && authState.isAuthenticated) {
        const hasLlmKey = authState.apiKeys.some(
          k => (k.provider === 'OPENAI' || k.provider === 'DEEPSEEK') && k.isActive
        );

        if (hasLlmKey) {
          const apiResult = await apiAnalyzeSentiment([news.headline]);
          if (apiResult.results && apiResult.results.length > 0) {
            const r = apiResult.results[0];
            response = {
              success: true,
              sentiment: { score: r.score, confidence: r.confidence, magnitude: r.magnitude },
              keywords: r.keywords,
              categories: r.categories,
              impact: r.impact,
              reasoning: r.reasoning,
            };
            actions.addLog('quantum', 'NEWS', `LLM Analysis (${apiResult.provider}): ${news.headline.slice(0, 40)}...`);
          } else {
            response = fallbackSentimentAnalysis(news.headline, news.summary);
          }
        } else {
          response = fallbackSentimentAnalysis(news.headline, news.summary);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        response = fallbackSentimentAnalysis(news.headline, news.summary);
      }

      const result: SentimentResult = {
        score: response.sentiment.score,
        confidence: response.sentiment.confidence,
        magnitude: response.sentiment.magnitude,
        keywords: response.keywords,
        categories: response.categories,
        impact: response.impact as SentimentResult['impact'],
      };

      this.sentimentHistory.push(result);
      if (this.sentimentHistory.length > this.maxHistory) {
        this.sentimentHistory.shift();
      }

      this.updateSentimentEMA(result.score, result.confidence);

      if (result.impact === 'CRITICAL' || result.impact === 'HIGH') {
        const indicator = result.score > 0 ? '[BULLISH]' : result.score < 0 ? '[BEARISH]' : '[NEUTRAL]';
        actions.addLog(
          result.score > 0.3 ? 'success' : result.score < -0.3 ? 'error' : 'info',
          'NEWS',
          `${indicator} ${result.impact}: ${news.headline.slice(0, 60)}...`
        );
      }

      this.notifyListeners();
      return result;

    } catch (error) {
      actions.addLog('error', 'NEWS', `Sentiment analysis failed: ${error}`);

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

  async fetchRealNews(query?: string): Promise<NewsItem[]> {
    if (!authState.isAuthenticated) {
      return [];
    }

    try {
      const result = await fetchNews(query);

      if (result.fallback) {
        actions.addLog('warn', 'NEWS', 'NewsAPI key not configured, using cached/simulated news');
        return [];
      }

      const newsItems: NewsItem[] = result.articles.map(article => ({
        id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date(article.publishedAt).getTime(),
        source: article.source,
        headline: article.title,
        summary: article.description,
        url: article.url,
        symbols: ['BTC', 'ETH'],
        categories: ['MARKET'],
      }));

      this.cachedNews = newsItems;
      actions.addLog('success', 'NEWS', `Fetched ${newsItems.length} real news articles`);

      return newsItems;
    } catch (error) {
      actions.addLog('error', 'NEWS', `Failed to fetch news: ${error}`);
      return [];
    }
  }

  async analyzeBatchHeadlines(headlines: string[]): Promise<SentimentResult[]> {
    if (this.isRealMode && authState.isAuthenticated) {
      const hasLlmKey = authState.apiKeys.some(
        k => (k.provider === 'OPENAI' || k.provider === 'DEEPSEEK') && k.isActive
      );

      if (hasLlmKey) {
        try {
          const result = await apiAnalyzeSentiment(headlines);
          return result.results.map(r => ({
            score: r.score,
            confidence: r.confidence,
            magnitude: r.magnitude,
            keywords: r.keywords,
            categories: r.categories,
            impact: r.impact,
          }));
        } catch (error) {
          actions.addLog('warn', 'NEWS', 'Batch analysis failed, using fallback');
        }
      }
    }

    return headlines.map(h => {
      const response = fallbackSentimentAnalysis(h);
      return {
        score: response.sentiment.score,
        confidence: response.sentiment.confidence,
        magnitude: response.sentiment.magnitude,
        keywords: response.keywords,
        categories: response.categories,
        impact: response.impact as SentimentResult['impact'],
      };
    });
  }

  private updateSentimentEMA(score: number, confidence: number): void {
    const alpha = 0.1 * confidence;
    this.sentimentEMA = alpha * score + (1 - alpha) * this.sentimentEMA;
    this.aggregatedSentiment = this.sentimentEMA;
  }

  getAggregatedSentiment(): number {
    return this.aggregatedSentiment;
  }

  getSentimentHistory(limit: number = 10): SentimentResult[] {
    return this.sentimentHistory.slice(-limit);
  }

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

  subscribe(callback: (sentiment: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.aggregatedSentiment));
  }

  reset(): void {
    this.sentimentHistory = [];
    this.aggregatedSentiment = 0;
    this.sentimentEMA = 0;
    this.cachedNews = [];
  }

  getCachedNews(): NewsItem[] {
    return this.cachedNews;
  }
}

export const newsOracle = new NewsOracle();

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

export function startNewsFeedSimulation(): () => void {
  const interval = setInterval(async () => {
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
  }, 5000);

  return () => clearInterval(interval);
}

export async function startRealNewsFeed(): Promise<() => void> {
  const fetchAndAnalyze = async () => {
    const news = await newsOracle.fetchRealNews('cryptocurrency bitcoin ethereum');
    for (const item of news.slice(0, 5)) {
      await newsOracle.analyzeSentiment(item);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  await fetchAndAnalyze();

  const interval = setInterval(fetchAndAnalyze, 60000);

  return () => clearInterval(interval);
}
