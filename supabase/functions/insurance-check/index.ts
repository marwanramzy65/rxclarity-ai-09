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

    const prompt = `# ROLE AND GOAL
You are "PharmAVerse AI" processing a First Prescription Submission WITHOUT any attached lab results or clinical notes. You must evaluate coverage based on the "First Fill Policy".

# "FIRST FILL" POLICY AND DECISION-MAKING LOGIC

### Tier 1: 🟥 AUTO-DENY (Always Denied)
- Category: Multivitamins, Cosmetics, Weight Management, Sexual Enhancement, Herbal & OTC Tonics. (e.g., Vitamax, Perfectil, Orlistat, Viagra).
- Decision: denied. Reason: "Preventive, cosmetic, or lifestyle drug not covered by policy."

### Tier 2: 🟩 PROVISIONAL_COVER (First Fill Approved)
- Class: Acute Condition Medications (Antibiotics like Augmentin; Analgesics like Brufen).
- Decision: approved. Reason: "Standard course for acute condition covered on first fill."
- Class: Chronic Disease Medications (Antihypertensives like Concor; Antidiabetics like Glucophage).
- Decision: approved. Reason: "Provisional one-month supply approved. A medical report with diagnosis is required for future refills."

### Tier 3: 🟨 FLAG_REVIEW (Requires Documentation, Even for First Fill)
- Class: Lab-Dependent Supplements (Iron like Ferrotron; Vitamin D like Sanso D).
- Decision: limited. Reason: "Requires lab test results for coverage."
- Class: Specialist & High-Cost Medications (Psychiatric meds like Cipralex; Hormonal therapies like Eltroxin; Biologics like Humira).
- Decision: limited. Reason: "Requires specialist medical report and diagnosis confirmation."

# OUTPUT FORMAT
Provide the decision in the exact JSON format below, with no extra text.
{
  "finalDecision": "approved" | "limited" | "denied",
  "message": "A brief summary of the decision.",
  "details": [
    {
      "name": "Medication Name",
      "decision": "approved" | "denied" | "limited",
      "reason": "Specific reason based on the policy."
    }
  ]
}

IMPORTANT: 
- Use "approved" for medications that are covered
- Use "limited" for medications that need additional documentation or review
- Use "denied" for medications that are not covered
- finalDecision should be "approved" if all medications approved, "limited" if any need review, "denied" if all denied

Analyze the following prescription and provide your response:
${drugsList}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llamaApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
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
      // Try multiple parsing strategies
      let jsonText = generatedText;

      // Strategy 1: Look for JSON block in markdown
      const jsonMatch = generatedText.match(/```json\s*(\{.*?\})\s*```/s);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Strategy 2: Look for standalone JSON object
        const standaloneMatch = generatedText.match(/\{[^{}]*"finalDecision"[^{}]*\}/s);
        if (standaloneMatch) {
          jsonText = standaloneMatch[0];
        } else {
          // Strategy 3: Remove everything before first { and after last }
          const firstBrace = generatedText.indexOf('{');
          const lastBrace = generatedText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            jsonText = generatedText.substring(firstBrace, lastBrace + 1);
          }
        }
      }

      insuranceDecision = JSON.parse(jsonText.trim());

      // Validate required fields
      if (!insuranceDecision.finalDecision || !insuranceDecision.message) {
        throw new Error('Missing required fields in insurance decision');
      }

      // Ensure finalDecision is lowercase and valid
      insuranceDecision.finalDecision = insuranceDecision.finalDecision.toLowerCase();
      if (!['approved', 'limited', 'denied'].includes(insuranceDecision.finalDecision)) {
        console.warn('Invalid finalDecision value, defaulting to approved');
        insuranceDecision.finalDecision = 'approved';
      }

      // Ensure details array exists
      if (!insuranceDecision.details) {
        insuranceDecision.details = [];
      }

    } catch (parseError) {
      console.error('Failed to parse Groq response:', generatedText);
      console.error('Parse error:', (parseError as Error).message);
      // Fallback decision
      insuranceDecision = {
        finalDecision: "approved",
        message: "Coverage approved under standard policy. Manual review may be required for final determination.",
        details: []
      };
    }

    return new Response(JSON.stringify(insuranceDecision), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in insurance-check function:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        finalDecision: "approved",
        message: "System error occurred. Prescription approved pending manual review."
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});