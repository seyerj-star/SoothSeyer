export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { query, usedVideoIds = [] } = req.body
  try {
    const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(query) + '&type=video&maxResults=5&videoDuration=medium&videoEmbeddable=true&key=' + process.env.YOUTUBE_API_KEY
    const response = await fetch(url)
    const data = await response.json()
    if (!data.items || data.items.length === 0) return res.json({error:'No videos found'})
    const video = data.items.find(item => !usedVideoIds.includes(item.id.videoId)) || data.items[0]
    res.json({
      videoId: video.id.videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.medium?.url
    })
  } catch (err) {
    res.status(500).json({error:'YouTube search failed'})
  }
}
