# Generate Prescription Codes - Edge Function

Secure prescription code generator with cryptographic randomness and checksum validation.

## Features

- **8-character codes** (6 random + 2 checksum)
- **Cryptographically secure** using `crypto.getRandomValues()`
- **1+ trillion possible combinations**
- **Checksum validation** to catch errors
- **Batch generation** up to 100 codes at once

## Code Format

```
A7K9M2X5  (raw)
A7K9-M2X5 (formatted)
```

**Character Set**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes I, O, 0, 1)

## API Usage

### 1. Generate Codes

**Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-prescription-codes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "count": 10
  }'
```

**Response:**
```json
{
  "success": true,
  "codes": [
    {
      "id": "uuid-here",
      "code": "A7K9M2X5",
      "formatted": "A7K9-M2X5",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ],
  "count": 10
}
```

### 2. Validate Code

**Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/generate-prescription-codes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "code": "A7K9M2X5"
  }'
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "exists": true,
  "validFormat": true,
  "codeData": {
    "id": "uuid",
    "code": "A7K9M2X5",
    "is_active": true,
    "created_at": "2025-10-18T12:00:00Z"
  }
}
```

## Integration Examples

### JavaScript/TypeScript

```typescript
// Generate codes
async function generateCodes(count: number) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/generate-prescription-codes',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        count: count,
      }),
    }
  );
  
  const result = await response.json();
  return result.codes;
}

// Validate code
async function validateCode(code: string) {
  const response = await fetch(
    'https://your-project.supabase.co/functions/v1/generate-prescription-codes',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate',
        code: code,
      }),
    }
  );
  
  const result = await response.json();
  return result.valid;
}
```

### React Component Example

```tsx
import { useState } from 'react';
import { supabase } from './supabaseClient';

function CodeGenerator() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-prescription-codes',
        {
          body: { action: 'generate', count: 10 }
        }
      );
      
      if (error) throw error;
      setCodes(data.codes);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generateCodes} disabled={loading}>
        Generate 10 Codes
      </button>
      <ul>
        {codes.map(c => (
          <li key={c.id}>{c.formatted}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Security Features

1. **Cryptographic Random**: Uses Web Crypto API
2. **Checksum Validation**: Last 2 chars validate first 6
3. **Uniqueness Check**: Verifies against database before insertion
4. **Rate Limiting**: Max 100 codes per request
5. **RLS Policies**: Database-level security

## Deployment

Deploy this function using Supabase CLI:

```bash
# Deploy single function
supabase functions deploy generate-prescription-codes

# Test locally
supabase functions serve generate-prescription-codes
```

## Testing

```bash
# Local testing
curl -X POST http://localhost:54321/functions/v1/generate-prescription-codes \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate", "count": 5}'
```

## Error Handling

The function returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (invalid action or missing code)
- `500` - Server error

All responses include:
```json
{
  "success": boolean,
  "error": "error message" // only if success is false
}
```
