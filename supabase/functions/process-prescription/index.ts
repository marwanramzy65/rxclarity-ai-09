import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { patientName, patientId, insuranceTier, selectedDrugs } = await req.json();
    
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('Processing prescription for user:', user.id);
    console.log('Prescription details:', { patientName, patientId, insuranceTier, selectedDrugs });

    const startTime = Date.now();

    // Step 1: Create the prescription record
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        user_id: user.id,
        patient_name: patientName,
        patient_id: patientId,
        insurance_tier: insuranceTier,
      })
      .select()
      .single();

    if (prescriptionError) {
      console.error('Error creating prescription:', prescriptionError);
      throw new Error('Failed to create prescription record');
    }

    console.log('Created prescription:', prescription.id);

    // Step 2: Find or create drug records and link them to the prescription
    const prescriptionDrugs = [];
    
    for (const selectedDrug of selectedDrugs) {
      // Find existing drug or create new one
      let { data: existingDrug, error: drugSearchError } = await supabase
        .from('drugs')
        .select('*')
        .eq('name', selectedDrug.name)
        .eq('strength', selectedDrug.strength)
        .single();

      if (drugSearchError && drugSearchError.code !== 'PGRST116') {
        console.error('Error searching for drug:', drugSearchError);
        throw new Error('Failed to search for drug');
      }

      let drugId;
      if (existingDrug) {
        drugId = existingDrug.id;
      } else {
        // Create new drug
        const { data: newDrug, error: drugCreateError } = await supabase
          .from('drugs')
          .insert({
            name: selectedDrug.name,
            strength: selectedDrug.strength,
            generic_name: selectedDrug.name, // Simplified for demo
          })
          .select()
          .single();

        if (drugCreateError) {
          console.error('Error creating drug:', drugCreateError);
          throw new Error('Failed to create drug record');
        }
        drugId = newDrug.id;
      }

      // Link drug to prescription
      const { error: linkError } = await supabase
        .from('prescription_drugs')
        .insert({
          prescription_id: prescription.id,
          drug_id: drugId,
          quantity: selectedDrug.quantity,
        });

      if (linkError) {
        console.error('Error linking drug to prescription:', linkError);
        throw new Error('Failed to link drug to prescription');
      }

      prescriptionDrugs.push({
        name: selectedDrug.name,
        strength: selectedDrug.strength,
        quantity: selectedDrug.quantity
      });
    }

    // Step 3: Call drug interaction check
    let drugInteractions = { interactions: [] };
    try {
      const interactionResponse = await supabase.functions.invoke('drug-interaction-check', {
        body: { drugs: prescriptionDrugs }
      });

      if (interactionResponse.data && !interactionResponse.error) {
        drugInteractions = interactionResponse.data;
        
        // Store interactions in database
        if (drugInteractions.interactions && drugInteractions.interactions.length > 0) {
          for (const interaction of drugInteractions.interactions) {
            await supabase
              .from('drug_interactions')
              .insert({
                prescription_id: prescription.id,
                drug_pair: interaction.drug_pair,
                severity: interaction.severity,
                interaction_type: interaction.interaction_type,
                description: interaction.description,
                recommendation: interaction.recommendation,
              });
          }
        }
      } else {
        console.error('Drug interaction check failed:', interactionResponse.error);
      }
    } catch (error) {
      console.error('Error calling drug interaction check:', error);
    }

    // Step 4: Call insurance check
    let insuranceDecision = {
      finalDecision: "approved",
      message: "Coverage approved under standard policy."
    };
    
    try {
      const insuranceResponse = await supabase.functions.invoke('insurance-check', {
        body: { 
          drugs: prescriptionDrugs, 
          insuranceTier, 
          patientInfo: { name: patientName, id: patientId }
        }
      });

      if (insuranceResponse.data && !insuranceResponse.error) {
        insuranceDecision = insuranceResponse.data;
      } else {
        console.error('Insurance check failed:', insuranceResponse.error);
      }
    } catch (error) {
      console.error('Error calling insurance check:', error);
    }

    // Step 5: Update prescription with results
    const processingTime = Date.now() - startTime;
    
    const { error: updateError } = await supabase
      .from('prescriptions')
      .update({
        insurance_decision: insuranceDecision.finalDecision,
        insurance_message: insuranceDecision.message,
        processing_time: `${processingTime} milliseconds`,
      })
      .eq('id', prescription.id);

    if (updateError) {
      console.error('Error updating prescription:', updateError);
      throw new Error('Failed to update prescription with results');
    }

    console.log('Prescription processed successfully:', prescription.id);

    // Return the complete results
    const result = {
      prescriptionId: prescription.id,
      insuranceDecision,
      drugInteractions,
      processingTime: `${processingTime}ms`
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-prescription function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        prescriptionId: null,
        insuranceDecision: {
          finalDecision: "approved",
          message: "System error occurred. Prescription approved pending manual review."
        },
        drugInteractions: { interactions: [] }
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});