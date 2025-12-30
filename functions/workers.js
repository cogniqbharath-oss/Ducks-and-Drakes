// Common Cloudflare Worker for Multiple Projects
// Supports: Yodelin-Broth-Company-and-Beer-Garden, Mozart's Restaurant, ducks-and-drakes
// Worker URL: https://gentle-dew-813d.cogniq-bharath.workers.dev/

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Handle CORS Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests for the chatbot
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    try {
      // Read and parse the request body carefully
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { message, projectId } = body;

      // Validate required fields
      if (!message) {
        return new Response(JSON.stringify({ error: "No message provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!projectId) {
        return new Response(JSON.stringify({ error: "No projectId provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Project configuration with flexible ID matching
      const projectConfig = {
        "Yodelin-Broth-Company-and-Beer-Garden": {
          apiKeyVar: "GEMINI_API_KEY",
          fallbackKey: "AIzaSyAp8rRKRHkGK2-LV0yoM6swjEoe_mtI-y8",
          contextPrompt: `You are the Yodelin Assistant, a friendly and local host for Yodelin Broth Company & Beer Garden in Leavenworth, WA. Use emojis (🏔️, 🍲, 🌲). Mention bone broth and Front St.`
        },
        "Mozarts_Restaurant": {
          apiKeyVar: "API_KEY_Mozarts_Restaurant",
          contextPrompt: `You are Mozart, the AI Concierge for Mozart's Restaurant. Speak with sophistication and warmth.`
        },
        "Mozart's Restaurant": {
          apiKeyVar: "API_KEY_Mozarts_Restaurant",
          contextPrompt: `You are Mozart, the AI Concierge for Mozart's Restaurant. Speak with sophistication and warmth.`
        },
        "ducks-and-drakes": {
          apiKeyVar: "API_KEY_DUCK",
          contextPrompt: `You are the friendly assistant for Ducks and Drakes, a casual waterfront pub. Speak with a fun, relaxed tone.`
        }
      };

      const config = projectConfig[projectId];
      if (!config) {
        return new Response(JSON.stringify({ error: "Invalid projectId: " + projectId }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get API Key (Env Var -> Fallback -> Error)
      const apiKey = env[config.apiKeyVar] || config.fallbackKey;

      if (!apiKey) {
        return new Response(JSON.stringify({
          error: "Configuration Error",
          message: `${config.apiKeyVar} is not set in Cloudflare environment variables.`
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const fullPrompt = `${config.contextPrompt}\n\nUser asked: ${message}`;
      const modelsToTry = ["gemma-2-27b-it", "gemma-3-27b-it", "gemini-2.0-flash", "gemini-1.5-flash"];
      let errors = [];

      for (const model of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking of a response.";
            return new Response(JSON.stringify({ reply }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          } else {
            const err = await response.text();
            errors.push(`${model}: ${err.substring(0, 100)}`);
          }
        } catch (e) {
          errors.push(`${model}: ${e.message}`);
        }
      }

      // If we reached here, all models failed
      return new Response(JSON.stringify({
        error: "All AI models are currently overwhelmed",
        details: errors.join(" | ")
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: "Worker runtime error",
        message: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  },
};