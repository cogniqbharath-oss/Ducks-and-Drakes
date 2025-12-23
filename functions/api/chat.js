// Cloudflare Pages Function for /api/chat endpoint
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { message } = await request.json();

        console.log('Received message:', message);
        console.log('API Key present:', !!env.GEMINI_API_KEY);

        // Enhanced system prompt
        const systemPrompt = `You are the friendly AI bartender assistant for Ducks and Drakes, a beloved sports bar in Leavenworth, WA.

BUSINESS INFO:
- Location: 221 8th St, Leavenworth, WA 98826
- Phone: (509) 548-0270
- Hours: Daily 11:00 AM - 1:00 AM
- Vibe: Casual sports bar with pool tables, karaoke nights, great food & drinks
- Specialties: Burgers, fries, American classics, draft beer, full bar

YOUR PERSONALITY:
- Friendly, welcoming, and enthusiastic
- Use casual language (like a real bartender)
- Be concise but helpful
- Show excitement about the food and atmosphere

IMPORTANT RULES:
- Keep responses SHORT (2-3 sentences max)
- If asked about bookings/reservations, ask for their name and phone number
- For food images, say "I can show you some pictures!" (frontend handles this)
- Never make up information - stick to what you know
- Be conversational and natural

USER QUESTION: ${message}

YOUR RESPONSE (keep it brief and friendly):`;

        // Call Gemini API with the working model
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

        console.log('Calling Gemini API (Model: gemini-2.5-flash)...');

        let response;
        let data;
        let success = false;

        // Retry logic with exponential backoff
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await fetch(geminiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 200
                        }
                    })
                });

                if (response.status === 429) {
                    console.log(`Attempt ${attempt + 1}: Rate limited. Waiting...`);
                    const waitTime = Math.pow(2, attempt) * 1000;
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }

                if (response.status === 200) {
                    success = true;
                    break;
                }
            } catch (e) {
                console.error(`Attempt ${attempt + 1} error:`, e);
            }
        }

        console.log('API Response status:', response ? response.status : 'No response');

        if (success) {
            data = await response.json();
            console.log('API Response data:', JSON.stringify(data).substring(0, 200));
        }

        let reply = "I'm here to help! Ask me about our hours, menu, or events!";

        if (success && data.candidates && data.candidates[0]?.content) {
            reply = data.candidates[0].content.parts[0].text;
            console.log('Got reply:', reply.substring(0, 50));
        } else {
            console.error('No candidates in response or bad status');
        }

        return new Response(JSON.stringify({ reply }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });

    } catch (error) {
        console.error('Error in chat function:', error.message, error.stack);
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
        },
    });
}
