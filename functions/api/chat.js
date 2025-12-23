// Cloudflare Pages Function for /api/chat endpoint
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { message } = await request.json();
    
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

    // Call Gemini API with the latest model
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    let reply = "Sorry, I'm having trouble connecting right now. Please try again!";
    
    if (data.candidates && data.candidates[0]?.content) {
      reply = data.candidates[0].content.parts[0].text;
    }

    return new Response(JSON.stringify({ reply }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      reply: "I'm having trouble right now. Please try again in a moment!" 
    }), {
      status: 200, // Return 200 to avoid frontend errors
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
