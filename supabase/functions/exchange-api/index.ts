import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExchangeRequest {
  exchange: "BYBIT" | "BINANCE" | "COINBASE";
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

const EXCHANGE_CONFIGS = {
  BYBIT: {
    mainnet: "https://api.bybit.com",
    testnet: "https://api-testnet.bybit.com",
  },
  BINANCE: {
    mainnet: "https://fapi.binance.com",
    testnet: "https://testnet.binancefuture.com",
  },
  COINBASE: {
    mainnet: "https://api.coinbase.com",
    testnet: "https://api.coinbase.com", // Coinbase uses same endpoint for sandbox (different keys)
  },
};

function generateBybitSignature(
  timestamp: string,
  apiKey: string,
  apiSecret: string,
  recvWindow: string,
  queryString: string
): string {
  const paramStr = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  return createHmac("sha256", apiSecret).update(paramStr).digest("hex");
}

function generateBinanceSignature(
  queryString: string,
  apiSecret: string
): string {
  return createHmac("sha256", apiSecret).update(queryString).digest("hex");
}

function generateCoinbaseSignature(
  timestamp: string,
  method: string,
  path: string,
  body: string,
  apiSecret: string
): string {
  const message = timestamp + method + path + body;
  return createHmac("sha256", apiSecret).update(message).digest("hex");
}

async function getApiKeys(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  exchange: string
) {
  const { data, error } = await supabase
    .from("api_keys")
    .select("api_key_encrypted, api_secret_encrypted, is_testnet")
    .eq("user_id", userId)
    .eq("provider", exchange)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`No active API key found for ${exchange}`);
  }

  return {
    apiKey: data.api_key_encrypted,
    apiSecret: data.api_secret_encrypted,
    isTestnet: data.is_testnet,
  };
}

async function callBybitApi(
  baseUrl: string,
  endpoint: string,
  method: string,
  apiKey: string,
  apiSecret: string,
  params?: Record<string, string>,
  body?: Record<string, unknown>
): Promise<Response> {
  const timestamp = Date.now().toString();
  const recvWindow = "5000";

  let queryString = "";
  if (params) {
    queryString = new URLSearchParams(params).toString();
  } else if (body) {
    queryString = JSON.stringify(body);
  }

  const signature = generateBybitSignature(
    timestamp,
    apiKey,
    apiSecret,
    recvWindow,
    queryString
  );

  const headers: Record<string, string> = {
    "X-BAPI-API-KEY": apiKey,
    "X-BAPI-SIGN": signature,
    "X-BAPI-SIGN-TYPE": "2",
    "X-BAPI-TIMESTAMP": timestamp,
    "X-BAPI-RECV-WINDOW": recvWindow,
  };

  let url = `${baseUrl}${endpoint}`;
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (method === "GET" && params) {
    url += `?${queryString}`;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

async function callBinanceApi(
  baseUrl: string,
  endpoint: string,
  method: string,
  apiKey: string,
  apiSecret: string,
  params?: Record<string, string>
): Promise<Response> {
  const timestamp = Date.now().toString();

  const queryParams = new URLSearchParams(params || {});
  queryParams.set("timestamp", timestamp);
  queryParams.set("recvWindow", "5000");

  const queryString = queryParams.toString();
  const signature = generateBinanceSignature(queryString, apiSecret);
  queryParams.set("signature", signature);

  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  return fetch(url, {
    method,
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  });
}

async function callCoinbaseApi(
  baseUrl: string,
  endpoint: string,
  method: string,
  apiKey: string,
  apiSecret: string,
  body?: Record<string, unknown>
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  
  const signature = generateCoinbaseSignature(
    timestamp,
    method,
    endpoint,
    bodyStr,
    apiSecret
  );

  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    "CB-ACCESS-KEY": apiKey,
    "CB-ACCESS-SIGN": signature,
    "CB-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT")) {
    fetchOptions.body = bodyStr;
  }

  return fetch(url, fetchOptions);
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

    const requestBody: ExchangeRequest = await req.json();
    const { exchange, endpoint, method, params, body } = requestBody;

    if (!exchange || !endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing exchange or endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const keys = await getApiKeys(serviceClient, user.id, exchange);
    const baseUrl = keys.isTestnet
      ? EXCHANGE_CONFIGS[exchange].testnet
      : EXCHANGE_CONFIGS[exchange].mainnet;

    let response: Response;

    if (exchange === "BYBIT") {
      response = await callBybitApi(
        baseUrl,
        endpoint,
        method || "GET",
        keys.apiKey,
        keys.apiSecret || "",
        params,
        body
      );
    } else if (exchange === "COINBASE") {
      response = await callCoinbaseApi(
        baseUrl,
        endpoint,
        method || "GET",
        keys.apiKey,
        keys.apiSecret || "",
        body
      );
    } else {
      response = await callBinanceApi(
        baseUrl,
        endpoint,
        method || "GET",
        keys.apiKey,
        keys.apiSecret || "",
        params
      );
    }

    const responseData = await response.json();

    await serviceClient
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("provider", exchange)
      .eq("is_active", true);

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
