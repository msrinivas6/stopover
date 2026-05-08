module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }
if (req.method !== ‘POST’) { res.status(405).json({ error: ‘Method not allowed’ }); return; }

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) return res.status(500).json({ error: ‘API not configured’ });

const body = req.body || {};
const prompt = body.prompt;
const max_tokens = body.max_tokens;
if (!prompt) return res.status(400).json({ error: ‘No prompt provided’ });

const models = [‘llama-3.3-70b-versatile’, ‘llama-3.1-8b-instant’, ‘gemma2-9b-it’];

for (let i = 0; i < models.length; i++) {
try {
const response = await fetch(‘https://api.groq.com/openai/v1/chat/completions’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘Authorization’: ’Bearer ’ + apiKey
},
body: JSON.stringify({
model: models[i],
max_tokens: max_tokens || 3000,
messages: [
{ role: ‘system’, content: ‘You are an expert road trip planner. Always respond with valid JSON only.’ },
{ role: ‘user’, content: prompt }
]
})
});

```
  if (response.status === 429) {
    if (i < models.length - 1) { continue; }
    return res.status(429).json({ error: 'Rate limited. Please wait 30 seconds.' });
  }

  if (!response.ok) {
    if (i < models.length - 1) { continue; }
    return res.status(500).json({ error: 'API error' });
  }

  const data = await response.json();
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content : '';
  return res.status(200).json({ text: text });

} catch (err) {
  console.error('Error:', err.message);
  if (i === models.length - 1) {
    return res.status(500).json({ error: err.message });
  }
}
```

}
}