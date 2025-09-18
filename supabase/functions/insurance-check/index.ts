import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drugs, insuranceTier, patientInfo } = await req.json();
    
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No drugs provided for insurance check' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking insurance coverage for:', { drugs, insuranceTier, patientInfo });

    const llamaApiKey = Deno.env.get('LLAMA_API_TOKEN');
    if (!llamaApiKey) {
      throw new Error('Llama API key not configured');
    }

    // Format drugs list for the prompt
    const drugsList = drugs.map(drug => `${drug.name} ${drug.strength} (Qty: ${drug.quantity})`).join(', ');

    const prompt = `You are an insurance coverage AI for a pharmacy system. Analyze the following prescription for insurance coverage based on the patient's insurance tier.

Patient Insurance Tier: ${insuranceTier || 'Standard'}
Prescribed Medications: ${drugsList}

Insurance Coverage Rules:
**Basic Tier:**
- Generic drugs: 90% coverage
- Brand drugs: 70% coverage  
- Specialty drugs: 50% coverage
- Monthly limit: $500

**Standard Tier:**
- Generic drugs: 95% coverage
- Brand drugs: 80% coverage
- Specialty drugs: 70% coverage
- Monthly limit: $1000

**Premium Tier:**
- Generic drugs: 98% coverage
- Brand drugs: 90% coverage
- Specialty drugs: 85% coverage
- Monthly limit: $2000

**VIP Tier:**
- Generic drugs: 100% coverage
- Brand drugs: 95% coverage
- Specialty drugs: 90% coverage
- Monthly limit: $5000

Common Drug Classifications:
- Generic: Metformin, Lisinopril, Atorvastatin, Amlodipine, Levothyroxine, Omeprazole, Losartan
- Brand: Newer formulations, brand-name versions
- Specialty: High-cost medications, biologics, cancer drugs

Provide a decision in this exact JSON format:
{
  "finalDecision": "approved" | "limited" | "denied",
  "message": "Detailed explanation of the coverage decision and any conditions"
}

Decision Guidelines:
- "approved": Full coverage under the tier rules
- "limited": Partial coverage with conditions (prior auth, quantity limits, etc.)
- "denied": Not covered or exceeds limits

Analyze the prescription and provide the insurance decision:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llamaApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, response.statusText);
      console.error('Groq API error details:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq API response:', JSON.stringify(data, null, 2));

    // Extract the generated content
    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('No generated text received from Groq API');
    }

    // Parse the JSON response
    let insuranceDecision;
    try {
      // Remove potential markdown formatting
      const cleanedText = generatedText.replace(/```json|```/g, '').trim();
      insuranceDecision = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Groq response:', generatedText);
      // Fallback decision
      insuranceDecision = {
        finalDecision: "approved",
        message: "Coverage approved under standard policy. Manual review may be required for final determination."
      };
    }

    return new Response(JSON.stringify(insuranceDecision), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in insurance-check function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        finalDecision: "approved",
        message: "System error occurred. Prescription approved pending manual review."
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});