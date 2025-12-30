// Cloudflare Pages Function for /api/chat endpoint
/**
 * Project: ducks-and-drakes
 * API Key Var: env.API_KEY_DUCK
 * Model: gemma-3-27b-it
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
            return new Response(JSON.stringify({ error: "No message provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // System Prompt for 'Drake' the Bartender
        const systemPrompt = `You are 'Drake', the friendly, veteran bartender at Ducks and Drakes, a beloved sports bar and smokehouse in Leavenworth, WA.

BUSINESS INFO:
- Location: 221 8th St, Leavenworth, WA 98826
- Hours: Daily 11:00 AM - 1:00 AM
- Vibe: Casual sports bar, smokehouse BBQ, pool tables, karaoke, lively atmosphere.
- Specialties: Smokehouse BBQ (Brisket, Pulled Pork), Burgers, Draft Beer, Cocktails.

YOUR PERSONALITY:
- Warm, welcoming, and unpretentious.
- Use casual, natural language (e.g., "You got it!", "Coming right up!", "No worries").
- Never say "As an AI". You ARE Drake.

IMPORTANT RULES:
- Keep responses SHORT (2 sentences max).
- If asked about bookings, ask for their name and phone number.
- For food images, say "I can pull up some photos of that!".

USER MESSAGE: ${userMessage}

DRAKE'S RESPONSE:`;

        // API Configuration
        const model = "gemma-3-27b-it";
        const apiKey = env.API_KEY_DUCK;

        if (!apiKey) {
            console.error("API_KEY_DUCK not configured in environment variables.");
            return new Response(JSON.stringify({ error: "API Key Configuration Error" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Call Google AI API
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                },
            }),
        });

        const data = await response.json();

        let reply = "Hey! I'm having a quick technical glitch with my talk-box. Ask me about our menu or hours!";

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            reply = data.candidates[0].content.parts[0].text;
        }

        return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error) {
        console.error('Error in chat function:', error);
        return new Response(JSON.stringify({
            reply: "Hey there! I'm having a quick technical hiccup. Try asking about our hours, menu, or events!"
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
        });
    }
}

// Handle CORS preflight
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
