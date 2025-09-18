import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedMedication {
  name: string;
  strength: string;
  directions: string;
  found: boolean;
  dbMatch?: {
    id: string;
    name: string;
    strength: string;
    generic_name: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'No image data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing prescription image extraction...');

    const azureApiKey = Deno.env.get('AZURE_AI_API_KEY');
    if (!azureApiKey) {
      throw new Error('Azure AI API key not configured');
    }

    // Get Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to binary for Azure AI
    const base64Data = imageData.split(',')[1]; // Remove data:image/...;base64, prefix
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    console.log('Sending image to Azure AI for processing...');
    
    // Call Azure AI service
    const response = await fetch('https://pharmaverse.services.ai.azure.com/api/models/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${azureApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: [
          {
            role: 'system',
            content: `You are a prescription parsing assistant. Extract medication information from prescription images and return it in JSON format. For each medication found, include:
            - name: The medication name (generic or brand)
            - strength: The dosage/strength (e.g., "5mg", "250mg")
            - directions: The complete dosage instructions
            
            Return only a JSON object with this exact structure:
            {
              "medications": [
                {
                  "name": "Medication Name",
                  "strength": "5mg",
                  "directions": "Take 1 tablet daily"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all medications from this prescription image. Focus on drug names, strengths, and directions for use.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('Azure AI API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Azure AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Azure AI response received');
    
    // Extract the generated content
    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('No generated text received from Azure AI');
    }

    console.log('Parsing extracted medications...');
    
    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response and parse JSON
      const cleanedText = generatedText.replace(/```json|```/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Azure AI response:', generatedText);
      // Fallback: try to extract basic medication info from text
      extractedData = { medications: [] };
    }

    const medications: ExtractedMedication[] = [];
    
    // Process each extracted medication
    for (const med of extractedData.medications || []) {
      console.log(`Processing medication: ${med.name} ${med.strength}`);
      
      // Try to find matching drug in database
      let dbMatch = null;
      let found = false;
      
      try {
        const { data: matchedDrugs, error } = await supabase
          .from('drugs')
          .select('*')
          .ilike('name', `%${med.name}%`)
          .limit(5);

        if (!error && matchedDrugs && matchedDrugs.length > 0) {
          // Look for exact or close matches
          const exactMatch = matchedDrugs.find(drug => 
            drug.name.toLowerCase() === med.name.toLowerCase() && 
            drug.strength === med.strength
          );
          
          if (exactMatch) {
            dbMatch = exactMatch;
            found = true;
          } else {
            // Look for name match with different strength
            const nameMatch = matchedDrugs.find(drug => 
              drug.name.toLowerCase() === med.name.toLowerCase()
            );
            if (nameMatch) {
              dbMatch = nameMatch;
              found = true;
            }
          }
        }
      } catch (dbError) {
        console.error('Database search error:', dbError);
        // Continue without database match
      }

      medications.push({
        name: med.name,
        strength: med.strength,
        directions: med.directions || '',
        found,
        dbMatch
      });
    }

    console.log(`Successfully processed ${medications.length} medications`);

    return new Response(JSON.stringify({
      success: true,
      medications
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-prescription function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        medications: []
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});