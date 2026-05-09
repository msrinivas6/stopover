module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API not configured" });

  const body = req.body || {};
  const prompt = body.prompt;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  const max_tokens = Math.min(parseInt(body.max_tokens) || 4000, 8000);
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

  for (let i = 0; i < models.length; i++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: models[i],
        max_tokens: max_tokens,
        messages: [
          { role: "system", content: "You are an expert road trip planner. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (response.status === 429) {
      if (i < models.length - 1) { continue; }
      return res.status(429).json({ error: "Rate limited. Please wait 30 seconds." });
    }

    const data = await response.json();

    if (!response.ok) {
      if (i < models.length - 1) { continue; }
      return res.status(500).json({ error: data.error ? data.error.message : "API error" });
    }

    const text = data.choices[0].message.content;
    return res.status(200).json({ text: text });
  }

  return res.status(500).json({ error: "All models failed" });
}

module.exports.config = { api: { bodyParser: { sizeLimit: "4mb" } } };
