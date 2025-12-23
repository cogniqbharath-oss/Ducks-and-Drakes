
export default {
  async fetch(request, env) {
    // Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method === "POST") {
      try {
        const { message } = await request.json();
        
        // System prompt with business details
        const systemPrompt = `You are the friendly and helpful AI assistant for specific business "Ducks and Drakes", a sports bar in Leavenworth, WA.
        
        Business Info:
        - Name: Ducks and Drakes
        - Location: 221 8th St, Leavenworth, WA 98826
        - Hours: Open until 1:00 AM daily.
        - Vibe: Casual, homey, sports bar, patio, pool tables, karaoke nights.
        - Food/Drink: Sports bar fare (burgers, fries), American grub, draft beer.
        
        Your Role:
        - Answer questions about hours, location, and menu items.
        - Manage event inquiries (karaoke schedule, pool availability).
        - If someone asks to book a table or event, ask for their name, party size, and preferred time to "put them on the waitlist" or "pass it to a manager" (simulate this).
        - Be concise, quick, and friendly. Use emojis occasionally.
        
        Current User Inquiry: ${message}`;

        // Call Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });

        const data = await response.json();
        let reply = "Sorry, I am having trouble connecting to the bar right now.";
        
        if (data.candidates && data.candidates[0].content) {
            reply = data.candidates[0].content.parts[0].text;
        }

        return new Response(JSON.stringify({ reply }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
