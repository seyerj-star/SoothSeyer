export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { messages, courseTitle, sectionTitle, sectionDescription } = req.body
  const systemPrompt = 'You are an expert AI tutor for the course: ' + courseTitle + '. The learner is studying: ' + sectionTitle + '. Section overview: ' + sectionDescription + '. Keep all responses under 80 words. Lead with one sharp sentence answering the question directly. Then give 3 bullet points maximum using a dash (-) as the bullet. No headers, no bold, no tables, no markdown. Be direct and practical.'
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body: JSON.stringify({model:'claude-opus-4-6',max_tokens:300,system:systemPrompt,messages:messages})
    })
    const data = await response.json()
    if (!data.content) return res.status(500).json({error:'API error',detail:data})
    res.json({message:data.content[0].text})
  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({error:err.message})
  }
}
