/**
 * Worker URL: https://noisy-king-dd9b.cogniq-bharath.workers.dev/
 * Project: ducks-and-drakes
 * API Key Var: env.API_KEY_DUCK
 * Model: gemma-3-27b-it (with fallback)
 */

export default {
    async fetch(request, env) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed" }), {
                status: 200, // Returning 200 as requested for better frontend handling
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        try {
            const body = await request.json();
            const userMessage = body.message;

            if (!userMessage) {
                return new Response(JSON.stringify({ reply: "I didn't hear anything! What's up?" }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders },
                });
            }

            // 1. Configuration with Fallbacks
            const apiKey = env.API_KEY_DUCK || "AIzaSyD27GQeQ7a2oea0AgMMqur_mSBr6r5wIdQ";
            const models = ["gemma-3-27b-it", "gemma-2-27b-it", "gemini-1.5-flash"];

            const systemPrompt = `You are 'Drake', the friendly bartender at Ducks and Drakes in Leavenworth, WA.
Business: 221 8th St. Hours: 11AM-1AM.
Vibe: Sports bar, BBQ.
Tone: Casual, warm.
Rules: 2 sentences max. If asked for booking, ask for name/phone.
USER: ${userMessage}
DRAKE:`;

            let reply = "";
            let success = false;

            // Try models sequentially
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
                    }
                } catch (e) {
                    console.error(`Error with ${model}:`, e);
                }
            }

            if (!success) {
                reply = "The bar's a bit busy right now, but I'm here! Ask me about our menu or location.";
            }

            return new Response(JSON.stringify({ reply }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });

        } catch (error) {
            return new Response(JSON.stringify({
                reply: "Hey! Something tripped me up. Try asking about our BBQ or hours!"
            }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }
    },
};
