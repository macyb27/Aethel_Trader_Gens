import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlphaVantageRequest {
  function: string;
  params?: Record<string, string>;
}

async function getApiKey(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  provider: string,
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const requestBody: AlphaVantageRequest = await req.json();
    const { function: functionName, params } = requestBody;

    if (!functionName) {
      return new Response(
        JSON.stringify({ error: "Missing Alpha Vantage function" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = await getApiKey(serviceClient, user.id, "ALPHA_VANTAGE");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Alpha Vantage key not configured" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const queryParams = new URLSearchParams({
      function: functionName,
      apikey: apiKey,
      ...(params || {}),
    });

    const response = await fetch(`https://www.alphavantage.co/query?${queryParams.toString()}`);
    const responseText = await response.text();

    await serviceClient
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("provider", "ALPHA_VANTAGE")
      .eq("is_active", true);

    return new Response(responseText, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
