export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { topic, level } = req.body
  const prompt = 'Create a 5-section learning course for: ' + topic + ' at ' + level + ' level. Return ONLY this JSON structure with no extra text: {"title":"Course Title","estimatedHours":10,"description":"One sentence.","sections":[{"title":"Section Title","description":"One sentence.","youtubeQuery":"search terms here","subtopics":["topic1","topic2"],"keyTakeaways":["point1","point2"]}]}'
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body: JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1500,messages:[{role:'user',content:prompt}]})
    })
    const data = await response.json()
    if (!data.content) return res.status(500).json({error:'API error',detail:data})
    const text = data.content[0].text.trim()
    const clean = text.replace(/```json|```/g,'').trim()
    const course = JSON.parse(clean)
    res.json(course)
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({error:err.message})
  }
}
