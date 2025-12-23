// Cloudflare Pages Function for /api/chat endpoint
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { message } = await request.json();

        console.log('Received message:', message);
        console.log('API Key present:', !!env.GEMINI_API_KEY);

        // System prompt with business details
        const systemPrompt = `You are the friendly and helpful AI assistant for "Ducks and Drakes", a sports bar in Leavenworth, WA.
    
    Business Info:
    - Name: Ducks and Drakes
    - Location: 221 8th St, Leavenworth, WA 98826
    - Hours: Open until 1:00 AM daily
    - Vibe: Casual sports bar with pool tables, karaoke nights, great food and drinks
    - Food: Burgers, fries, American classics
    - Drinks: Draft beer, full bar
    
    Your Role:
    - Answer questions about hours, location, and menu items
    - Manage event inquiries (karaoke schedule, pool availability)
    - If someone asks to book a table, ask for their name and phone number
    - Be concise, friendly, and helpful
    
    Current User Inquiry: ${message}`;

        // Call Gemini API with the working model
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`;

        console.log('Calling Gemini API...');
        const response = await fetch(geminiUrl, {
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

        console.log('API Response status:', response.status);
        const data = await response.json();
        console.log('API Response data:', JSON.stringify(data).substring(0, 200));

        let reply = "I'm here to help! Ask me about our hours, menu, or events!";

        if (response.status === 200 && data.candidates && data.candidates[0]?.content) {
            reply = data.candidates[0].content.parts[0].text;
            console.log('Got reply:', reply.substring(0, 50));
        } else {
            console.error('No candidates in response or bad status:', response.status, data);
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
