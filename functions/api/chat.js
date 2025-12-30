// Cloudflare Pages Function for /api/chat endpoint
/**
 * Project: ducks-and-drakes
 * Configured for: gemma-3-27b-it
 */

export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
    };

    try {
        const body = await request.json();
        const userMessage = body.message;

        if (!userMessage) {
            return new Response(JSON.stringify({
                reply: "Hey! I didn't catch that. Could you say it again?"
            }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // 1. Get API Key with multiple fallbacks
        // Prioritize env variable, then the last known working fallback key
        const apiKey = env.API_KEY_DUCK || "AIzaSyD27GQeQ7a2oea0AgMMqur_mSBr6r5wIdQ";

        // 2. Models to try (Requested model first, then reliable fallback)
        const models = ["gemma-3-27b-it", "gemma-2-27b-it", "gemini-1.5-flash", "gemini-2.0-flash-exp"];

        let reply = "";
        let success = false;
        let lastError = "";

        // System Prompt for 'Drake' the Bartender
        const systemPrompt = `You are 'Drake', the friendly, veteran bartender at Ducks and Drakes in Leavenworth, WA.
Location: 221 8th St, Leavenworth, WA. Hours: 11 AM - 1 AM.
Vibe: Sports bar, BBQ smokehouse, pool tables.
Personality: Warm, casual (e.g. "Coming right up!"), unpretentious.
Rule: Keep it short (2 sentences max). Answer about menu, events, or location.
If asked for a booking, ask for name and phone.

USER MESSAGE: ${userMessage}
DRAKE'S RESPONSE:`;

        for (const model of models) {
            try {
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        reply = data.candidates[0].content.parts[0].text;
                        success = true;
                        break;
                    }
                } else {
                    const errData = await response.text();
                    lastError = `Model ${model} failed: ${response.status} - ${errData.substring(0, 50)}`;
                }
            } catch (innerError) {
                lastError = `Fetch failed for ${model}: ${innerError.message}`;
            }
        }

        if (!success) {
            reply = "I'm having a quiet night at the bar! (Technical hiccup). Ask about our BBQ or hours while I check the taps!";
            console.error("All models failed. Last error:", lastError);
        }

        // ALWAYS return 200 status as requested
        return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error) {
        console.error('Critical oversight in chat function:', error);
        return new Response(JSON.stringify({
            reply: "The bar's a bit noisy right now! Try asking again in a second."
        }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    });
}
