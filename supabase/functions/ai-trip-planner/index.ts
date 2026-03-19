import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://go-nepal.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripPlannerRequest {
  interest: string;
  duration: string;
  difficulty: string;
  budget: string;
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
    const { interest, duration, difficulty, budget } = await req.json() as TripPlannerRequest;

    const prompt = `You are an expert Nepal travel planner. Create a personalized trip itinerary based on these preferences:

Interests: ${interest || 'General exploration'}
Duration: ${duration || '7 days'}
Difficulty Level: ${difficulty || 'Moderate'}
Budget: ${budget || 'Mid-range'}

3. Recommended accommodations (NEVER recommend specific hotel names; instead, say "search for budget guesthouses in [area]")
4. Estimated costs in USD
5. Important tips for each location (NEVER mention Maps.me; instead, say "use GoNepal's Offline Toolkit to save your route")
6. Best time to visit recommendations

Format the response in a clear, structured way with markdown formatting.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert Nepal travel planner with deep knowledge of Nepali destinations, culture, trekking routes, and local customs. Provide helpful, accurate, and engaging travel advice.

IMPORTANT BEHAVIORAL RULES:
1. NEVER recommend specific hotel names. Always suggest searching for guesthouses in the area.
2. NEVER mention Maps.me. Always recommend using GoNepal's Offline Toolkit.
3. Do NOT use hashtags (#) anywhere in your response - avoid words like #Travel, #Nepal, #Adventure, etc.
4. Use proper formatting with line breaks and spacing between sections
5. Present information in a clean, professional way without hashtags`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const itinerary = data.choices[0]?.message?.content || 'Unable to generate itinerary';

    return new Response(
      JSON.stringify({ success: true, itinerary }),
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
