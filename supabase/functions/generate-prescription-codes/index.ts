import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================================
// CODE GENERATOR FUNCTIONS
// ============================================================================

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes I, O, 0, 1 to avoid confusion
const CODE_LENGTH = 8;

/**
 * Calculate a 2-character checksum for the code
 */
function calculateChecksum(code: string): string {
    let sum = 0;

    for (let i = 0; i < code.length; i++) {
        const charIndex = CHARSET.indexOf(code[i]);
        const weight = (i % 2 === 0) ? 2 : 1;
        sum += charIndex * weight;
    }

    // Generate 2-char checksum
    const checksumValue = sum % (CHARSET.length * CHARSET.length);
    const char1 = CHARSET[Math.floor(checksumValue / CHARSET.length)];
    const char2 = CHARSET[checksumValue % CHARSET.length];

    return char1 + char2;
}

/**
 * Generate a code with checksum for additional validation
 * Format: 6 chars + 2 char checksum
 */
function generatePrescriptionCodeWithChecksum(): string {
    const crypto = globalThis.crypto;

    if (!crypto || !crypto.getRandomValues) {
        throw new Error('Crypto API not available');
    }

    // Generate 6 random characters
    const randomBytes = new Uint8Array(6);
    crypto.getRandomValues(randomBytes);

    let baseCode = '';
    for (let i = 0; i < 6; i++) {
        baseCode += CHARSET[randomBytes[i] % CHARSET.length];
    }

    // Calculate simple checksum (Luhn-like algorithm adapted for alphanumeric)
    const checksum = calculateChecksum(baseCode);

    return baseCode + checksum;
}

/**
 * Validate a code with checksum
 */
function validatePrescriptionCode(code: string): boolean {
    if (code.length !== CODE_LENGTH) {
        return false;
    }

    // Check if all characters are valid
    for (const char of code) {
        if (!CHARSET.includes(char)) {
            return false;
        }
    }

    // Extract base code and checksum
    const baseCode = code.substring(0, 6);
    const providedChecksum = code.substring(6, 8);
    const calculatedChecksum = calculateChecksum(baseCode);

    return providedChecksum === calculatedChecksum;
}

/**
 * Format code for display (with hyphens for readability)
 * Example: A7K9-M2X5
 */
function formatCode(code: string): string {
    if (code.length !== CODE_LENGTH) {
        return code;
    }
    return `${code.substring(0, 4)}-${code.substring(4, 8)}`;
}

/**
 * Batch generate multiple unique codes
 */
async function generateBatchCodes(
    count: number,
    ensureUnique: (code: string) => Promise<boolean>
): Promise<string[]> {
    const codes: string[] = [];
    const maxAttempts = count * 10; // Prevent infinite loop
    let attempts = 0;

    while (codes.length < count && attempts < maxAttempts) {
        const code = generatePrescriptionCodeWithChecksum();

        // Check if code is unique in database
        if (await ensureUnique(code)) {
            codes.push(code);
        }

        attempts++;
    }

    if (codes.length < count) {
        throw new Error(`Could only generate ${codes.length} unique codes out of ${count} requested`);
    }

    return codes;
}

// ============================================================================
// EDGE FUNCTION HANDLER
// ============================================================================

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        const { action, count = 1, code } = await req.json();

        // Action: generate - Generate new codes
        if (action === 'generate') {
            const numCodes = Math.min(count, 100); // Limit to 100 codes per request

            const ensureUnique = async (generatedCode: string): Promise<boolean> => {
                const { data, error } = await supabaseClient
                    .from('prescription_codes')
                    .select('id')
                    .eq('code', generatedCode)
                    .maybeSingle();

                if (error) {
                    console.error('Error checking code uniqueness:', error);
                    return false;
                }

                return data === null; // True if code doesn't exist
            };

            const codes = await generateBatchCodes(numCodes, ensureUnique);

            // Insert codes into database
            const codeRecords = codes.map(c => ({
                code: c,
                description: 'Auto-generated prescription code',
                is_active: true,
            }));

            const { data, error } = await supabaseClient
                .from('prescription_codes')
                .insert(codeRecords)
                .select();

            if (error) {
                throw error;
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    codes: data.map(d => ({
                        id: d.id,
                        code: d.code,
                        formatted: formatCode(d.code),
                        created_at: d.created_at,
                    })),
                    count: data.length,
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            );
        }

        // Action: validate - Validate a code
        if (action === 'validate') {
            if (!code) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Code is required' }),
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 400,
                    }
                );
            }

            const isValidFormat = validatePrescriptionCode(code);

            // Check if code exists in database
            const { data, error } = await supabaseClient
                .from('prescription_codes')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    valid: isValidFormat && data !== null,
                    exists: data !== null,
                    validFormat: isValidFormat,
                    codeData: data || null,
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            );
        }

        // Invalid action
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Invalid action. Use "generate" or "validate"'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
