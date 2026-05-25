export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { query } = req.body

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&videoDuration=medium&videoEmbeddable=true&key=${process.env.YOUTUBE_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return res.json({ error: 'No videos found' })
    }

    const video = data.items[0]
    res.json({
      videoId: video.id.videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url
    })
  } catch (error) {
    res.status(500).json({ error: 'YouTube search failed' })
  }
}
