export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Only allow POST
    if (request.method !== "POST") {
      return new Response("Not Found", { status: 404 });
    }

    try {
      const body = await request.json();
      const userMessage = body.message;

      if (!userMessage) {
        return new Response(
          JSON.stringify({ error: "Message is required" }),
          { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      // Enhanced system prompt
      const prompt = `You are the friendly AI bartender assistant for Ducks and Drakes, a beloved sports bar in Leavenworth, WA.

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

USER QUESTION: ${userMessage}

YOUR RESPONSE (keep it brief and friendly):`;

      // Retry logic parameters
      const maxRetries = 3;
      let reply = "Sorry, I'm having trouble connecting right now. Please try again!";

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Use gemini-2.5-flash
          const geminiResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
            env.GEMINI_API_KEY,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 200,
                },
              }),
            }
          );

          if (geminiResponse.status === 429) {
            // Rate limit - wait and retry
            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          const data = await geminiResponse.json();
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            reply = data.candidates[0].content.parts[0].text;
            break; // Success
          }
        } catch (e) {
          console.error(`Attempt ${attempt + 1} failed:`, e);
        }
      }

      return new Response(
        JSON.stringify({ reply }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          reply: "Hey there! I'm having a quick technical hiccup. Try asking about our hours, menu, or events!",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }
  },
};