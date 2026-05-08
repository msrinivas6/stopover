export const config = { api: { bodyParser: { sizeLimit: ‘4mb’ } } };

export default async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }
if (req.method !== ‘POST’) { res.status(405).json({ error: ‘Method not allowed’ }); return; }

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) return res.status(500).json({ error: ‘API not configured’ });

const { prompt, max_tokens } = req.body || {};
if (!prompt) return res.status(400).json({ error: ‘No prompt provided’ });

// Try primary model, fall back to faster model if rate limited
const models = [
‘llama-3.3-70b-versatile’,
‘llama-3.1-8b-instant’,
‘gemma2-9b-it’
];

for (const model of models) {
try {
const response = await fetch(‘https://api.groq.com/openai/v1/chat/completions’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘Authorization’: `Bearer ${apiKey}`
},
body: JSON.stringify({
model,
max_tokens: max_tokens || 3000,
messages: [
{
role: ‘system’,
content: ‘You are an expert road trip planner. Always respond with valid JSON only. No markdown, no explanation, just the JSON object.’
},
{ role: ‘user’, content: prompt }
]
})
});

```
  // If rate limited, try next model
  if (response.status === 429) {
    console.log(`Model ${model} rate limited, trying next...`);
    continue;
  }

  const data = await response.json();
  if (!response.ok) {
    console.error(`Model ${model} error:`, data.error?.message);
    continue;
  }

  const text = data.choices?.[0]?.message?.content || '';
  return res.status(200).json({ text, model });

} catch (err) {
  console.error(`Model ${model} exception:`, err.message);
  continue;
}
```

}

// All models failed
return res.status(429).json({ error: ‘All models rate limited. Please wait 30 seconds and try again.’ });
}