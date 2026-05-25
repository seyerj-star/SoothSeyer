export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { topic, level } = req.body

  const prompt = `You are a smart learning assistant. A user wants to learn "${topic}" and reach a "${level}" level.

Generate exactly 3 clarifying questions to understand their background and tailor their learning path.

Return ONLY a JSON array with this exact structure (no markdown, no extra text):
[
  {
    "id": "q1",
    "question": "Question text here?",
    "type": "select",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  },
  {
    "id": "q2", 
    "question": "Question text here?",
    "type": "select",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  },
  {
    "id": "q3",
    "question": "Question text here?",
    "type": "text",
    "placeholder": "Your answer here..."
  }
]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    console.log('Anthropic response:', JSON.stringify(data))

    if (!data.content) {
      return res.status(500).json({ error: 'API error', detail: data })
    }

    const text = data.content[0].text.trim()
    const clean = text.replace(/```json|```/g, '').trim()
    const questions = JSON.parse(clean)
    res.json({ questions })

  } catch (err) {
    console.error('Handler error:', err)
    res.status(500).json({ error: err.message })
  }
}