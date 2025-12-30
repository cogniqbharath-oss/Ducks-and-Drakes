export default {
  async fetch(request, env) {
    // 1. Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    // 2. Only allow POST requests for the chat
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }
    try {
      const body = await request.json();
      const userMessage = body.message;
      const projectId = body.project_id || "ducks-and-drakes"; // Default to your project id
      if (!userMessage) {
        return new Response(
          JSON.stringify({ error: "Message is required" }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
      // 3. Define the System Prompt for Ducks and Drakes
      const systemPrompt = `You are 'Drake', the friendly AI bartender for Ducks and Drakes, a beloved sports bar and smokehouse in Leavenworth, WA.
      
BUSINESS INFO:
- Location: 221 8th St, Leavenworth, WA 98826
- Phone: (509) 548-0270
- Hours: Daily 11:00 AM - 1:00 AM
- Vibe: Casual sports bar, smokehouse BBQ, pool tables, karaoke nights.
- Specialties: Smokehouse BBQ (Brisket, Pulled Pork), Burgers, Draft Beer, and Cocktails.
YOUR PERSONALITY:
- Warm, welcoming, and unpretentious (like a local friend).
- Use casual, natural language (e.g., "You got it!", "Coming right up!", "No worries").
- Never say "As an AI" or "I am a virtual assistant". You ARE Drake.
IMPORTANT RULES:
- Keep responses SHORT (2 sentences max).
- If asked about bookings/reservations, ask for their name and phone number.
- For food images, say "I can pull up some photos of that!".
- Admit if you don't know something. Be conversational.
USER MESSAGE: ${userMessage}
DRAKE'S RESPONSE:`;
      // 4. Configuration from your request
      const model = "gemma-3-27b-it";
      const apiKey = env.API_KEY_DUCK; // Using your specific env variable
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      // 5. Call the Google AI API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150,
          },
        }),
      });
      const data = await response.json();

      let reply = "Hey there! I'm having a quick technical hiccup. Try asking about our hours or menu!";

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        reply = data.candidates[0].content.parts[0].text;
      }
      // 6. Return the response to your frontend
      return new Response(
        JSON.stringify({
          reply: reply,
          project: projectId
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};