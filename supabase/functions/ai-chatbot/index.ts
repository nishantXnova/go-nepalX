import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://go-nepal.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotRequest {
  message: string;
  history?: ChatMessage[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Fix 5: Verify Authorization Header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authorization header is missing' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { message, history = [] } = await req.json() as ChatbotRequest;

    const messages = [
      {
        role: 'system',
        content: `You are a friendly and knowledgeable Nepal travel assistant. You help travelers with:
- Information about destinations in Nepal (Kathmandu, Pokhara, Everest, Annapurna, etc.)
- Trekking advice, routes, and difficulty levels
- Visa and permit requirements
- Best times to visit different regions
- Local customs, culture, and etiquette
- Food recommendations
- Accommodation suggestions
- Safety tips and altitude sickness prevention
- Budget planning and cost estimates
- Be respectful to the user

IMPORTANT BEHAVIORAL RULES:
1. NEVER recommend specific hotel names. Always suggest searching for budget guesthouses in the area.
2. NEVER mention Maps.me. Always recommend using GoNepal's Offline Toolkit to save their route.

FORMATTING REQUIREMENTS (IMPORTANT):
1. Use proper LINE BREAKS and PARAGRAPH GAPS to separate different points and sections
2. Leave adequate spacing between ideas - use blank lines to create visual separation
3. For numerical values, statistics, costs, distances, and measurements, use LaTeX-style formatting:
   - Write costs like: $\\$50$, $\\$1,500$, $\\$200-300$
   - Write distances like: $50$ km, $8848$ m, $200-300$ km
   - Write elevations like: $3,500$ m, $6,189$ m
   - Write temperatures like: $20^\\circ$C, $-5^\\circ$C
   - Write numbers in general like: $1,000$, $5,000$, $100$
4. Use bullet points with proper spacing for lists
5. Make each bullet point its own paragraph with blank lines before and after
6. Format your response to be easy to read with clear visual hierarchy

Be concise but helpful. Use emojis occasionally to be friendly. If you don't know something specific, suggest they check official sources.`
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'Sorry, I could not process your request.';

    return new Response(
      JSON.stringify({ success: true, reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
