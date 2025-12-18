import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NewsRequest {
  action: "fetch_news" | "analyze_sentiment";
  query?: string;
  headlines?: string[];
  provider?: "OPENAI" | "DEEPSEEK";
}

interface NewsArticle {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface SentimentResult {
  score: number;
  confidence: number;
  magnitude: number;
  keywords: string[];
  categories: string[];
  impact: string;
  reasoning: string;
}

async function getApiKey(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  provider: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("api_key_encrypted")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.api_key_encrypted;
}

async function fetchNewsAPI(apiKey: string, query: string): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: query || "cryptocurrency bitcoin ethereum",
    language: "en",
    sortBy: "publishedAt",
    pageSize: "20",
  });

  const response = await fetch(
    `https://newsapi.org/v2/everything?${params.toString()}`,
    {
      headers: { "X-Api-Key": apiKey },
    }
  );

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.articles || []).map((article: any) => ({
    title: article.title,
    description: article.description || "",
    source: article.source?.name || "Unknown",
    url: article.url,
    publishedAt: article.publishedAt,
  }));
}

async function analyzeWithOpenAI(
  apiKey: string,
  headlines: string[]
): Promise<SentimentResult[]> {
  const systemPrompt = `You are a financial sentiment analyzer. Analyze the following news headlines for cryptocurrency/trading sentiment.
For each headline, provide:
- score: number from -1 (very bearish) to +1 (very bullish)
- confidence: number from 0 to 1 indicating confidence in the assessment
- magnitude: number from 0 to 1 indicating strength of sentiment
- keywords: array of key terms affecting sentiment
- categories: array like ["MARKET", "REGULATORY", "TECHNOLOGY", "SECURITY"]
- impact: one of "LOW", "MEDIUM", "HIGH", "CRITICAL"
- reasoning: brief explanation

Respond with a JSON array of results.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(headlines) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return parsed.results || parsed;
  } catch {
    return headlines.map(() => ({
      score: 0,
      confidence: 0.5,
      magnitude: 0.3,
      keywords: [],
      categories: ["GENERAL"],
      impact: "LOW",
      reasoning: "Unable to parse sentiment",
    }));
  }
}

async function analyzeWithDeepSeek(
  apiKey: string,
  headlines: string[]
): Promise<SentimentResult[]> {
  const systemPrompt = `You are a financial sentiment analyzer. Analyze the following news headlines for cryptocurrency/trading sentiment.
For each headline, provide a JSON object with:
- score: number from -1 (very bearish) to +1 (very bullish)
- confidence: number from 0 to 1
- magnitude: number from 0 to 1
- keywords: array of key terms
- categories: array like ["MARKET", "REGULATORY", "TECHNOLOGY", "SECURITY"]
- impact: "LOW", "MEDIUM", "HIGH", or "CRITICAL"
- reasoning: brief explanation

Respond with JSON: { "results": [...] }`;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(headlines) },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return parsed.results || parsed;
  } catch {
    return headlines.map(() => ({
      score: 0,
      confidence: 0.5,
      magnitude: 0.3,
      keywords: [],
      categories: ["GENERAL"],
      impact: "LOW",
      reasoning: "Unable to parse sentiment",
    }));
  }
}

function fallbackSentimentAnalysis(headlines: string[]): SentimentResult[] {
  const bullishKeywords = ["rally", "surge", "gain", "bullish", "up", "rise", "growth", "adoption", "approval", "etf", "institutional"];
  const bearishKeywords = ["crash", "drop", "fall", "bearish", "down", "decline", "hack", "ban", "regulation", "sec", "lawsuit"];
  const highImpactKeywords = ["breaking", "urgent", "flash", "crash", "hack", "etf", "fed", "rate", "halving"];

  return headlines.map((headline) => {
    const text = headline.toLowerCase();
    let bullishCount = 0;
    let bearishCount = 0;
    let impactScore = 0;
    const foundKeywords: string[] = [];

    bullishKeywords.forEach((kw) => {
      if (text.includes(kw)) {
        bullishCount++;
        foundKeywords.push(kw);
      }
    });

    bearishKeywords.forEach((kw) => {
      if (text.includes(kw)) {
        bearishCount++;
        foundKeywords.push(kw);
      }
    });

    highImpactKeywords.forEach((kw) => {
      if (text.includes(kw)) impactScore++;
    });

    const total = bullishCount + bearishCount;
    let score = 0;
    if (total > 0) {
      score = (bullishCount - bearishCount) / total;
    }

    const confidence = Math.min(0.95, 0.3 + (total / 5) * 0.6);
    const magnitude = Math.min(1, total / 4);

    let impact: string;
    if (impactScore >= 2 || magnitude > 0.8) {
      impact = "CRITICAL";
    } else if (impactScore >= 1 || magnitude > 0.5) {
      impact = "HIGH";
    } else if (magnitude > 0.3) {
      impact = "MEDIUM";
    } else {
      impact = "LOW";
    }

    const categories: string[] = [];
    if (text.includes("price") || text.includes("market")) categories.push("MARKET");
    if (text.includes("regulation") || text.includes("sec") || text.includes("law")) categories.push("REGULATORY");
    if (text.includes("hack") || text.includes("security")) categories.push("SECURITY");
    if (text.includes("etf") || text.includes("institutional")) categories.push("INSTITUTIONAL");
    if (text.includes("tech") || text.includes("upgrade")) categories.push("TECHNOLOGY");
    if (categories.length === 0) categories.push("GENERAL");

    return {
      score,
      confidence,
      magnitude,
      keywords: foundKeywords,
      categories,
      impact,
      reasoning: `Keyword analysis: ${total} sentiment indicators found`,
    };
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestBody: NewsRequest = await req.json();
    const { action, query, headlines, provider } = requestBody;

    if (action === "fetch_news") {
      const newsApiKey = await getApiKey(serviceClient, user.id, "NEWS_API");

      if (!newsApiKey) {
        return new Response(
          JSON.stringify({ 
            error: "NewsAPI key not configured",
            articles: [],
            fallback: true 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const articles = await fetchNewsAPI(newsApiKey, query || "");

      return new Response(
        JSON.stringify({ articles, fallback: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "analyze_sentiment") {
      if (!headlines || headlines.length === 0) {
        return new Response(
          JSON.stringify({ error: "No headlines provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const preferredProvider = provider || "OPENAI";
      let llmApiKey = await getApiKey(serviceClient, user.id, preferredProvider);

      if (!llmApiKey && preferredProvider === "OPENAI") {
        llmApiKey = await getApiKey(serviceClient, user.id, "DEEPSEEK");
      } else if (!llmApiKey && preferredProvider === "DEEPSEEK") {
        llmApiKey = await getApiKey(serviceClient, user.id, "OPENAI");
      }

      let results: SentimentResult[];
      let usedProvider: string;

      if (llmApiKey) {
        try {
          const finalProvider = await getApiKey(serviceClient, user.id, "OPENAI") ? "OPENAI" : "DEEPSEEK";
          if (finalProvider === "OPENAI") {
            results = await analyzeWithOpenAI(llmApiKey, headlines);
          } else {
            results = await analyzeWithDeepSeek(llmApiKey, headlines);
          }
          usedProvider = finalProvider;
        } catch {
          results = fallbackSentimentAnalysis(headlines);
          usedProvider = "FALLBACK";
        }
      } else {
        results = fallbackSentimentAnalysis(headlines);
        usedProvider = "FALLBACK";
      }

      return new Response(
        JSON.stringify({ results, provider: usedProvider }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
