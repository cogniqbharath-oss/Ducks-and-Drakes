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

      // Create prompt with business context
      const prompt = `You are the AI assistant for Ducks and Drakes sports bar in Leavenworth, WA.

Location: 221 8th St, Leavenworth, WA 98826
Hours: Daily until 1:00 AM
Features: Pool tables, karaoke, great food & drinks

Be friendly and concise. If asked about bookings, request name and phone.

User: ${userMessage}
Assistant:`;

      // Use gemini-1.5-flash (the working model)
      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            },
          }),
        }
      );

      const data = await geminiResponse.json();

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm here to help! Ask me about our hours, menu, or events!";

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