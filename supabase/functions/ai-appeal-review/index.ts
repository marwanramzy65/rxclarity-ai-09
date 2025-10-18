import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEDICATION_POLICY = `
💊 PharmAVerse Egypt — Medication Coverage Policy (Demo v1)

🟥 AUTO-DENY (Non-medical / Preventive / Cosmetic Medications)
Automatically Not Covered if detected in prescription.

Category | Common Egyptian Brands | Reason
---|---|---
Multivitamins & tonics (general) | Vitamax, Centrum, Kerovit, Wellman, Wellwoman, limitless Man | Preventive only, no lab evidence
Cosmetic / aesthetic products | Collagen Plus, Perfectil, Pantogar, Hair Fact, Glow Hair, EVA Skin Vitamins | Aesthetic / hair & skin use
Weight & appetite drugs | Orlistat, Tulango-plus, Orly, Triactin | Cosmetic or weight management only
Sexual enhancement & fertility aids | Viagra, Cialis, Sildava, Powerecta, Diamondrecta 20 mg | Lifestyle / reproductive enhancement
Herbal & alternative medicine | Ginseng, Mega Herbs, Herbal Life, Bio Energy | Not medically approved
Non-prescription OTC tonics | Vitabiotics Complete, Seven Seas, Omega 3+6+9, Ginko Plus | General wellbeing only

🟩 ALLOW_IF_DOCUMENTED (Covered with Medical / Lab Evidence)
Covered only when lab or diagnosis confirms a real medical indication.

Class | Egyptian Brands | Required Lab / Diagnosis | Decision
---|---|---|---
Iron supplements | Ferrotron, Feroglobin, Phara-Fero, Ferrosanol | Hb below reference range | ✅ COVER
Vitamin D | Sanso D 10,000 IU, Sanso D 5,000 IU, Limitless Ossofortin 10,000 IU, Limitless Ossofortin 5,000 IU, Devarol, Vidrop | 25(OH)D below reference | ✅ COVER
Calcium | Osteocare, Caltrate, Calcimate, Calcinorm, Ca-D3 Sandoz | Low serum calcium or bone disease | ✅ COVER
Folic Acid / B12 | Fefol, Neuroton, Methycobal, Trineurobion, Folic Acid Tabs | Macrocytic anemia (MCV >100 or low B12) | ✅ COVER
Antibiotics | Augmentin, Flagyl, Azithromycin, Ceftriaxone, Ciprocin, Zithromax | Infection diagnosis or positive culture | ✅ COVER
Analgesics / Anti-inflammatory | Brufen, Cataflam, Panadol Extra, Voltaren, Celebrex, Paracetamol | Linked to trauma / surgery / chronic pain | ✅ COVER
Antihypertensives | Coversyl, Concor, Amlor, Tareg, Norvasc, Nebilet | Diagnosis: hypertension | ✅ COVER
Antidiabetics | Glucophage, Janumet, Trajenta, Amaryl, Insulatard, Novorapid | Diagnosis: diabetes | ✅ COVER
Lipid-lowering agents | Crestor, Atorvast, Liptrol, Ezetrol | Diagnosis: hyperlipidemia | ✅ COVER

🟨 FLAG_REVIEW (Medical Review Required)
These are context-sensitive drugs where AI cannot safely decide yet.

Class | Egyptian Brands | Reason
---|---|---
Psychiatric medications | Cipralex, Seroxat, Depakine, Tegretol, Amipride | Need psychiatric diagnosis confirmation
Hormonal therapies | Eltroxin, Prednisone, Dexamethasone, Diane-35, Yasmin | Indication verification required
Biologics / immunotherapy | Humira, Enbrel, Cosentyx, Xolair | High-cost biologics → manual approval
Off-label / experimental drugs | Any new unlisted brand | Need documentation / committee review
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AZURE_CHAT_API_KEY = Deno.env.get('AZURE_CHAT_API_KEY');
    const AZURE_CHAT_ENDPOINT = Deno.env.get('AZURE_CHAT_ENDPOINT') || 'https://aioptexeg.services.ai.azure.com/openai/v1/';
    const AZURE_CHAT_DEPLOYMENT = Deno.env.get('AZURE_CHAT_DEPLOYMENT') || 'Phi-4';
    const AZURE_VISION_API_KEY = Deno.env.get('AZURE_AI_API_KEY_VISION');
    const AZURE_VISION_ENDPOINT = Deno.env.get('AZURE_VISION_ENDPOINT');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!AZURE_CHAT_API_KEY) {
      throw new Error('AZURE_CHAT_API_KEY not configured');
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const {
      grievanceId,
      prescriptionId,
      deniedMedications,
      insuranceDecision,
      documentUrl,
      explanation
    } = await req.json();

    console.log('Processing AI appeal review for grievance:', grievanceId);

    let documentContent = '';
    let extractedLabResults = '';

    // If there's a document, use Azure AI Vision to extract and analyze it
    if (documentUrl) {
      console.log('Downloading document from:', documentUrl);
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('grievance-documents')
        .download(documentUrl);

      if (downloadError) {
        console.error('Error downloading document:', downloadError);
        documentContent = '[Document could not be downloaded]';
      } else if (AZURE_VISION_API_KEY && AZURE_VISION_ENDPOINT) {
        try {
          console.log('Analyzing document with Azure AI Vision...');

          // Convert file to base64 for Azure Vision
          const arrayBuffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // Call Azure AI Vision with read feature to extract text from lab report
          const visionResponse = await fetch(
            `${AZURE_VISION_ENDPOINT}/computervision/imageanalysis:analyze?features=read&api-version=2024-02-01`,
            {
              method: 'POST',
              headers: {
                'Ocp-Apim-Subscription-Key': AZURE_VISION_API_KEY,
                'Content-Type': 'application/octet-stream',
              },
              body: uint8Array,
            }
          );

          if (visionResponse.ok) {
            const visionData = await visionResponse.json();

            // Extract text from the readResult
            if (visionData.readResult?.blocks) {
              const extractedLines: string[] = [];
              for (const block of visionData.readResult.blocks) {
                for (const line of block.lines) {
                  extractedLines.push(line.text);
                }
              }
              extractedLabResults = extractedLines.join('\n');
              console.log('Extracted lab results from document:', extractedLabResults);

              documentContent = `[Lab Test Results Extracted from Document]\n${extractedLabResults}`;
            } else {
              documentContent = '[Document uploaded but no text could be extracted]';
            }
          } else {
            const errorText = await visionResponse.text();
            console.error('Azure Vision API error:', visionResponse.status, errorText);
            documentContent = '[Document uploaded but could not be analyzed]';
          }
        } catch (visionError) {
          console.error('Error analyzing document with Azure Vision:', visionError);
          documentContent = '[Document uploaded but analysis failed]';
        }
      } else {
        // Fallback if Azure Vision not configured
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        documentContent = `[Document uploaded: ${documentUrl}. This is a lab test or medical document that should be analyzed to determine if the denied medication is medically necessary.]`;
      }
    }

    // Construct prompt for AI
    const prompt = `You are a medical insurance review AI for PharmAVerse Egypt. Your job is to review appeals for denied medications based on submitted lab tests and medical documentation.

MEDICATION COVERAGE POLICY:
${MEDICATION_POLICY}

APPEAL DETAILS:
- Prescription ID: ${prescriptionId}
- Denied/Limited Medications: ${deniedMedications.join(', ')}
- Original Insurance Decision: ${insuranceDecision}
- Patient Explanation: ${explanation}
${documentContent ? `- Supporting Document: ${documentContent}` : '- No supporting document provided'}

INSTRUCTIONS:
1. Review the denied medications against the policy
2. If a document is provided, assume it contains lab test results that may support the medical necessity
3. Make a decision: APPROVE, DENY, or FLAG_REVIEW
4. Provide clear reasoning

RESPOND IN THIS EXACT JSON FORMAT:
{
  "decision": "APPROVE" | "DENY" | "FLAG_REVIEW",
  "reasoning": "Clear explanation of why you made this decision, referencing specific policy rules and lab evidence if mentioned",
  "covered_medications": ["list of medications now covered"],
  "still_denied": ["list of medications still denied"],
  "requires_review": ["list needing manual review"]
}`;

    console.log(`Sending request to Azure AI (${AZURE_CHAT_DEPLOYMENT})...`);

    // Ensure endpoint ends with slash
    const baseURL = AZURE_CHAT_ENDPOINT.endsWith('/') ? AZURE_CHAT_ENDPOINT : `${AZURE_CHAT_ENDPOINT}/`;

    // Call Azure AI Chat API (Phi-4 or Llama-3.3-70B)
    const aiResponse = await fetch(`${baseURL}chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AZURE_CHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AZURE_CHAT_DEPLOYMENT,
        messages: [
          {
            role: 'system',
            content: 'You are a medical insurance review AI. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Azure AI API error:', aiResponse.status, errorText);
      throw new Error(`Azure AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received:', aiData);

    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let aiDecision;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiDecision = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback decision
      aiDecision = {
        decision: 'FLAG_REVIEW',
        reasoning: 'AI response could not be parsed. Manual review required.',
        covered_medications: [],
        still_denied: deniedMedications,
        requires_review: deniedMedications
      };
    }

    console.log('AI Decision:', aiDecision);

    // Check if there are still denied medications
    const hasStillDenied = aiDecision.still_denied && aiDecision.still_denied.length > 0;
    const isFullyApproved = aiDecision.decision === 'APPROVE' && !hasStillDenied;

    // Update grievance with AI decision
    const { error: updateError } = await supabaseAdmin
      .from('grievances')
      .update({
        ai_decision: aiDecision.decision,
        ai_reasoning: aiDecision.reasoning,
        ai_reviewed_at: new Date().toISOString(),
        approved_medications: aiDecision.covered_medications || [],
        denied_medications: aiDecision.still_denied || [],
        // Only auto-approve if ALL medications are covered
        status: isFullyApproved ? 'approved' : 'pending',
        reviewer_notes: isFullyApproved
          ? `✅ AI Auto-Approved: All medications covered. ${aiDecision.reasoning}`
          : hasStillDenied
            ? `⚠️ Partial Approval: Some medications still denied. Approved: ${aiDecision.covered_medications?.join(', ') || 'none'}. Still Denied: ${aiDecision.still_denied?.join(', ')}. ${aiDecision.reasoning}`
            : aiDecision.decision === 'DENY'
              ? `❌ AI Denied: ${aiDecision.reasoning}`
              : `⚠️ Flagged for Review: ${aiDecision.reasoning}`,
        reviewed_at: isFullyApproved ? new Date().toISOString() : null
      })
      .eq('id', grievanceId);

    if (updateError) {
      console.error('Error updating grievance:', updateError);
      throw updateError;
    }

    console.log('Grievance updated successfully');

    // If appeal is approved (fully or partially), update the prescription's insurance decision
    if (isFullyApproved || (aiDecision.covered_medications && aiDecision.covered_medications.length > 0)) {
      console.log('Updating prescription insurance decision...');

      let newInsuranceDecision;
      let newInsuranceMessage;

      if (isFullyApproved) {
        // All medications approved
        newInsuranceDecision = 'approved';
        newInsuranceMessage = `Appeal approved: ${aiDecision.reasoning}`;
      } else if (hasStillDenied && aiDecision.covered_medications && aiDecision.covered_medications.length > 0) {
        // Partial approval
        newInsuranceDecision = 'limited';
        newInsuranceMessage = `Appeal partially approved. Covered: ${aiDecision.covered_medications.join(', ')}. Still denied: ${aiDecision.still_denied.join(', ')}. ${aiDecision.reasoning}`;
      } else {
        // Keep original decision if appeal was denied or flagged
        newInsuranceDecision = null;
        newInsuranceMessage = null;
      }

      if (newInsuranceDecision && newInsuranceMessage) {
        const { error: prescriptionUpdateError } = await supabaseAdmin
          .from('prescriptions')
          .update({
            insurance_decision: newInsuranceDecision,
            insurance_message: newInsuranceMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prescriptionId);

        if (prescriptionUpdateError) {
          console.error('Error updating prescription:', prescriptionUpdateError);
          // Don't throw error here - grievance update was successful
        } else {
          console.log('Prescription insurance decision updated successfully');
        }
      }
    }

    console.log('Appeal review process completed');

    return new Response(
      JSON.stringify({
        success: true,
        aiDecision: aiDecision.decision,
        reasoning: aiDecision.reasoning,
        details: aiDecision
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-appeal-review:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
