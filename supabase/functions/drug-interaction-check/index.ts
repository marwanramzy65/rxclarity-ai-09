import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { drugs } = await req.json();
    
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No drugs provided for interaction check' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking interactions for drugs:', drugs);

    const geminiApiKey = Deno.env.get('GEMENI_API_TOKEN');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Format drugs list for the prompt
    const drugsList = drugs.map(drug => `${drug.name} ${drug.strength}`).join(', ');

    const prompt = `You are given a list of prescribed drugs. Check for interactions using the following severity levels:
- Green (Acceptable): Safe to co-prescribe. No alert needed.
- Yellow (Conditional): Moderate interaction risk. Show a warning and recommendation.
- Red (Restricted): High/severe interaction risk. Show a strong warning and recommendation.
Rules:
- Only include Yellow and Red interactions in the response.
- Green-level interactions should be ignored and excluded from the output.
- This is for notification purposes only — do not block any dispensing logic.
- Output must be in JSON format with the following schema:
{
  "interactions": [
    {
      "drug_pair": ["Drug A", "Drug B"],
      "severity": "Yellow" | "Red",
      "interaction_type": "Minor" | "Moderate" | "Major",
      "description": "Short clinical explanation of the interaction",
      "recommendation": "Clinical recommendation for pharmacist"
    },
    ...
  ]
}
Pharmacy Insurance Policy – Drug Interaction Rules
1. Levels of Interaction
- Green (Acceptable): Safe to co-prescribe. May require routine monitoring.
- Yellow (Conditional): Risk of moderate side effects; use only if necessary with monitoring/dose adjustments.
- Red (Restricted): High risk of severe or life-threatening reactions; generally contraindicated.
2. Drug Interaction Categories:
**Diabetes**
- Green: Metformin + ACE inhibitors
- Yellow: Metformin + SGLT2 inhibitors → monitor for dehydration/ketoacidosis
- Red: Sulfonylureas + Insulin → severe hypoglycemia
**Hypertension & Cardiac**
- Green: ACE inhibitor + Thiazide diuretic
- Yellow: ACE inhibitor + ARB → hyperkalemia, kidney risk
- Red: Beta-blockers + Verapamil → severe bradycardia/heart block
**Oncology**
- Yellow: Chemotherapy + Antibiotics → bone marrow suppression
- Red: Immunotherapy (Nivolumab/Pembrolizumab) + Immunosuppressants (Methotrexate, Steroids) → infection risk, reduced efficacy
**Antibiotics**
- Green: Amoxicillin + Statin
- Yellow: Ciprofloxacin + Corticosteroids → tendon rupture
- Red: Linezolid + SSRIs → serotonin syndrome
**Cardiovascular**
- Yellow: Statins + Macrolides (Erythromycin, Clarithromycin) → rhabdomyolysis
- Red: Clopidogrel + NSAIDs → severe GI bleeding
**Respiratory**
- Yellow: LABA (Salmeterol) + Beta-blocker → reduced effectiveness
- Red: Theophylline + Ciprofloxacin → theophylline toxicity
**Pain Management**
- Yellow: NSAIDs + ACE inhibitors/ARBs → kidney damage
- Red: Opioids (Morphine, Tramadol) + Benzodiazepines → respiratory depression
**Psychiatry & Neurology**
- Yellow: SSRIs + NSAIDs → bleeding risk
- Red: Clozapine + Carbamazepine → bone marrow suppression
**Endocrinology**
- Yellow: Levothyroxine + PPIs → reduced absorption
- Red: Levothyroxine + Amiodarone → thyroid dysfunction
**Nephrology**
- Yellow: Erythropoietin + ACE inhibitors → hypertension
- Red: Potassium-sparing diuretics + ACE inhibitors/ARBs → hyperkalemia
**Dermatology**
- Yellow: Methotrexate + NSAIDs → methotrexate toxicity
- Red: Cyclosporine + Statins → rhabdomyolysis

Now analyze the following list of prescribed drugs and return a JSON object of any Yellow or Red interactions found:
[${drugsList}]`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    // Extract the generated content
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No generated text received from Gemini API');
    }

    // Parse the JSON response from Gemini
    let interactions;
    try {
      // Remove potential markdown formatting
      const cleanedText = generatedText.replace(/```json|```/g, '').trim();
      interactions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText);
      // Fallback: return empty interactions if parsing fails
      interactions = { interactions: [] };
    }

    return new Response(JSON.stringify(interactions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in drug-interaction-check function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        interactions: [] // Fallback to empty interactions
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});