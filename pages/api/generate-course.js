export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { topic, level } = req.body
  const sectionCount = level === 'Beginner' ? 4 : level === 'Intermediate' ? 5 : level === 'Advanced' ? 6 : 7
  const prompt = 'Create a ' + sectionCount + '-section learning course for: ' + topic + ' at ' + level + ' level. Return ONLY valid JSON: {"title":"Course Title","estimatedHours":10,"description":"one sentence","sections":[{"title":"short","description":"short","youtubeQuery":"string","subtopics":["a","b"],"keyTakeaways":["a","b"]}]} with exactly ' + sectionCount + ' sections. For each section youtubeQuery, format it exactly like this: "[section topic] tutorial for [level] [year 2024]" — make each query specific and distinct from the others so videos do not repeat.'
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
