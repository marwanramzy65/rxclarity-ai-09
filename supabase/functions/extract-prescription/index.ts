import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  similarMatches?: Array<{
    id: string;
    name: string;
    strength: string;
    generic_name: string;
    similarity: number;
  }>;
}

// Levenshtein distance algorithm for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

// Jaro-Winkler distance for better prefix matching
function jaroWinkler(s1: string, s2: string): number {
  const m1 = s1.length;
  const m2 = s2.length;

  if (m1 === 0 && m2 === 0) return 1.0;
  if (m1 === 0 || m2 === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(m1, m2) / 2) - 1;
  const s1Matches = new Array(m1).fill(false);
  const s2Matches = new Array(m2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < m1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, m2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < m1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / m1 + matches / m2 + (matches - transpositions / 2) / matches) / 3;

  // Calculate common prefix for Winkler modification
  let prefix = 0;
  for (let i = 0; i < Math.min(m1, m2, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

// N-gram similarity for partial matching
function ngramSimilarity(s1: string, s2: string, n: number = 2): number {
  const getNgrams = (str: string): Set<string> => {
    const ngrams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.add(str.slice(i, i + n));
    }
    return ngrams;
  };

  const ngrams1 = getNgrams(s1);
  const ngrams2 = getNgrams(s2);

  let intersection = 0;
  ngrams1.forEach(gram => {
    if (ngrams2.has(gram)) intersection++;
  });

  const union = ngrams1.size + ngrams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Combined similarity score using multiple algorithms
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Levenshtein-based similarity
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const levenshteinSim = maxLength === 0 ? 1 : 1 - (distance / maxLength);

  // Jaro-Winkler similarity (better for typos and transpositions)
  const jaroWinklerSim = jaroWinkler(s1, s2);

  // N-gram similarity (better for missing/extra characters)
  const ngramSim = ngramSimilarity(s1, s2, 2);

  // Weighted average (emphasize Jaro-Winkler for pharmaceutical names)
  return (jaroWinklerSim * 0.5) + (levenshteinSim * 0.25) + (ngramSim * 0.25);
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

    const azureApiKey = Deno.env.get('AZURE_AI_API_KEY_VISION');
    const azureVisionEndpoint = Deno.env.get('AZURE_VISION_ENDPOINT');

    if (!azureApiKey) {
      throw new Error('Azure AI Vision API key not configured');
    }
    if (!azureVisionEndpoint) {
      throw new Error('Azure Vision endpoint not configured');
    }

    // Get Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Sending image to Azure AI Vision for OCR processing...');

    // Prepare request body based on image data format
    let requestBody;
    let contentType;

    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // If it's a URL
      requestBody = JSON.stringify({ url: imageData });
      contentType = 'application/json';
    } else {
      // If it's base64 encoded image
      const base64Data = imageData.split(',')[1]; // Remove data:image/...;base64, prefix
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      requestBody = binaryData;
      contentType = 'application/octet-stream';
    }

    // Call Azure AI Vision API with read feature to extract text
    const visionResponse = await fetch(
      `${azureVisionEndpoint}/computervision/imageanalysis:analyze?features=read&api-version=2024-02-01`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureApiKey,
          'Content-Type': contentType,
        },
        body: requestBody,
      }
    );

    if (!visionResponse.ok) {
      console.error('Azure Vision API error:', visionResponse.status, visionResponse.statusText);
      const errorText = await visionResponse.text();
      console.error('Error details:', errorText);
      throw new Error(`Azure Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    console.log('Azure Vision response received');

    // Extract text from the readResult
    let extractedText = '';
    if (visionData.readResult?.blocks) {
      for (const block of visionData.readResult.blocks) {
        for (const line of block.lines) {
          extractedText += line.text + '\n';
        }
      }
    }

    console.log('Extracted text from image:', extractedText);

    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the image');
    }

    console.log('Extracted text from image:', extractedText);

    // Try to send the extracted text to Azure AI (Phi-4 or Llama) to get structured medication data.
    // If AZURE_CHAT_API_KEY is not configured or the AI call fails, fall back to the local parser below.
    const extractedData: { medications: Array<{ name: string; strength: string; directions: string }> } = { medications: [] };

    const AZURE_CHAT_API_KEY = Deno.env.get('AZURE_CHAT_API_KEY');
    const AZURE_CHAT_ENDPOINT = Deno.env.get('AZURE_CHAT_ENDPOINT') || 'https://aioptexeg.services.ai.azure.com/openai/v1/';
    const AZURE_CHAT_DEPLOYMENT = Deno.env.get('AZURE_CHAT_DEPLOYMENT') || 'Phi-4';

    if (AZURE_CHAT_API_KEY) {
      try {
        console.log(`Sending extracted text to ${AZURE_CHAT_DEPLOYMENT} for medication parsing...`);
        const promptSystem = `You are an assistant that extracts medication entries from raw prescription text.\nRespond ONLY with valid JSON in this exact shape: { "medications": [ { "name": string, "strength": string (may be empty), "directions": string (may be empty) } ] }`;
        const promptUser = `Extract medications from the following prescription text:\n\n${extractedText}`;

        // Ensure endpoint ends with slash
        const baseURL = AZURE_CHAT_ENDPOINT.endsWith('/') ? AZURE_CHAT_ENDPOINT : `${AZURE_CHAT_ENDPOINT}/`;

        const aiResponse = await fetch(`${baseURL}chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AZURE_CHAT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AZURE_CHAT_DEPLOYMENT,
            messages: [
              { role: 'system', content: promptSystem },
              { role: 'user', content: promptUser }
            ],
            max_tokens: 1000,
            temperature: 0,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices?.[0]?.message?.content || aiData.choices?.[0]?.text || '';

          // Try to extract JSON object from the model response
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed && Array.isArray(parsed.medications)) {
                extractedData.medications = parsed.medications.map((m: any) => ({
                  name: String(m.name || '').trim(),
                  strength: String(m.strength || '').trim(),
                  directions: String(m.directions || '').trim()
                }));
                console.log('Medications extracted by AI:', extractedData.medications);
              }
            } catch (parseErr) {
              console.error('Failed to parse JSON from AI response:', parseErr);
            }
          } else {
            console.warn('No JSON found in AI response; falling back to local parser');
          }
        } else {
          const errText = await aiResponse.text();
          console.error('Azure AI API error:', aiResponse.status, errText);
        }

      } catch (aiErr) {
        console.error('Error calling Azure AI API:', aiErr);
      }
    } else {
      console.log('AZURE_CHAT_API_KEY not configured; skipping AI parsing and using local parser');
    }

    // If Azure AI did not return structured meds, fall back to the original local parser
    if (!extractedData.medications || extractedData.medications.length === 0) {
      // Parse the extracted text to identify medications (local fallback)
      const lines = extractedText.split('\n').filter(line => line.trim());
      // Simple pattern matching for medications
      let currentMed: { name?: string; strength?: string; directions?: string } = {};
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const strengthMatch = line.match(/(\d+\s*(?:mg|mcg|g|ml|mg\/ml|%|units?|iu))/i);
        const directionsMatch = line.match(/(take|apply|use|inject|inhale|insert|tablet|capsule|dose|daily|twice|once)/i);

        if (strengthMatch && line.length < 100) {
          const parts = line.split(/\s+(?=\d+\s*(?:mg|mcg|g|ml|mg\/ml|%|units?|iu))/i);
          if (parts.length >= 2) {
            if (currentMed.name) {
              extractedData.medications.push({
                name: currentMed.name || '',
                strength: currentMed.strength || '',
                directions: currentMed.directions || ''
              });
            }
            currentMed = {
              name: parts[0].trim(),
              strength: strengthMatch[0].trim(),
              directions: parts.slice(1).join(' ').replace(strengthMatch[0], '').trim()
            };
          }
        } else if (directionsMatch && currentMed.name && !currentMed.directions) {
          currentMed.directions = line;
        } else if (!currentMed.name && line.length > 3 && line.length < 50 && !line.match(/patient|doctor|clinic|date|rx/i)) {
          currentMed.name = line;
        }
      }

      if (currentMed.name) {
        extractedData.medications.push({
          name: currentMed.name || '',
          strength: currentMed.strength || '',
          directions: currentMed.directions || ''
        });
      }
    }

    console.log('Parsing extracted medications...');

    const medications: ExtractedMedication[] = [];

    // Process each extracted medication
    for (const med of extractedData.medications || []) {
      console.log(`Processing medication: ${med.name} ${med.strength}`);

      // Try to find matching drug in database
      let dbMatch = null;
      let found = false;
      let similarMatches: Array<any> = [];

      try {
        // First, try to find close matches using ilike
        const { data: matchedDrugs, error } = await supabase
          .from('drugs')
          .select('*')
          .ilike('name', `%${med.name}%`)
          .limit(10);

        if (!error && matchedDrugs && matchedDrugs.length > 0) {
          // Look for exact or close matches
          const exactMatch = matchedDrugs.find((drug: any) =>
            drug.name.toLowerCase() === med.name.toLowerCase() &&
            drug.strength === med.strength
          );

          if (exactMatch) {
            dbMatch = exactMatch;
            found = true;
          } else {
            // Look for name match with different strength
            const nameMatch = matchedDrugs.find((drug: any) =>
              drug.name.toLowerCase() === med.name.toLowerCase()
            );
            if (nameMatch) {
              dbMatch = nameMatch;
              found = true;
            }
          }
        }

        // If no exact match found, use fuzzy matching
        if (!found) {
          console.log(`No exact match found for ${med.name}, trying fuzzy matching...`);

          // Get all drugs for fuzzy matching
          const { data: allDrugs, error: allError } = await supabase
            .from('drugs')
            .select('*')
            .limit(1000);

          if (!allError && allDrugs) {
            // Calculate similarity for each drug
            const drugsWithSimilarity = allDrugs.map((drug: any) => ({
              ...drug,
              similarity: calculateSimilarity(med.name, drug.name)
            }));

            // Sort by similarity (highest first)
            const sortedDrugs = drugsWithSimilarity
              .filter((drug: any) => drug.similarity >= 0.40)
              .sort((a: any, b: any) => b.similarity - a.similarity);

            if (sortedDrugs.length > 0) {
              const bestMatch = sortedDrugs[0];

              // If the best match is above 63%, treat it as an exact match
              if (bestMatch.similarity >= 0.63) {
                dbMatch = bestMatch;
                med.name = bestMatch.name; // Update to standardized name
                med.strength = bestMatch.strength; // Update to standardized strength
                found = true; // Mark as found since it's a strong match
                console.log(`Auto-matched ${med.name} to ${bestMatch.name} (${(bestMatch.similarity * 100).toFixed(1)}% similarity)`);

                // Still provide other similar matches for reference (excluding the best match)
                similarMatches = sortedDrugs.slice(0, 5);
              } else {
                // Below 65% threshold, keep as suggestions only
                similarMatches = sortedDrugs.slice(0, 5);
                dbMatch = bestMatch;
                found = false; // Keep found as false for weak matches
                console.log(`Found ${sortedDrugs.length} similar matches for ${med.name}, best match: ${(bestMatch.similarity * 100).toFixed(1)}% (below 55% threshold)`);
              }
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
        dbMatch,
        similarMatches: similarMatches.length > 0 ? similarMatches : undefined
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
        medications: []
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});