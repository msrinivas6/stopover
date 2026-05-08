module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) { res.status(200).end(); return; }
if (req.method !== ‘POST’) { res.status(405).json({ error: ‘Method not allowed’ }); return; }

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) return res.status(500).json({ error: ‘API not configured’ });

try {
const body = req.body || {};
const prompt = body.prompt;
if (!prompt) return res.status(400).json({ error: ‘No prompt provided’ });

```
// Cap tokens to avoid timeout - Vercel free tier has 10s limit
const max_tokens = Math.min(parseInt(body.max_tokens) || 3000, 3000);

const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + apiKey
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    max_tokens: max_tokens,
    messages: [
      { role: 'system', content: 'You are an expert road trip planner. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ]
  })
});

const data = await groqRes.json();

if (groqRes.status === 429) {
  return res.status(429).json({ error: 'Rate limited. Please wait 30 seconds.' });
}

if (!groqRes.ok) {
  return res.status(500).json({ error: data.error ? data.error.message : 'Groq error' });
}

const text = data.choices[0].message.content;
return res.status(200).json({ text: text });
```

} catch (err) {
console.error(‘Handler error:’, err.message);
return res.status(500).json({ error: err.message });
}
}

module.exports.config = { api: { bodyParser: { sizeLimit: ‘4mb’ } } };