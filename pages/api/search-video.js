export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { query, usedVideoIds = [] } = req.body

  const search = async (q, withDurationFilter = true) => {
    const durationParam = withDurationFilter ? '&videoDuration=medium' : ''
    const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(q) + '&type=video&maxResults=10&videoEmbeddable=true' + durationParam + '&key=' + process.env.YOUTUBE_API_KEY
    const response = await fetch(url)
    const data = await response.json()
    if (!data.items || data.items.length === 0) return null
    return data.items.find(item => !usedVideoIds.includes(item.id.videoId)) || data.items[0]
  }

  try {
    let video = await search(query, true)
    if (!video) video = await search(query, false)
    if (!video) video = await search(query.split(' ').slice(0, 3).join(' ') + ' tutorial', false)
    if (!video) video = await search(query.split(' ')[0] + ' tutorial', false)
    if (!video) return res.json({ error: 'No videos found' })
    res.json({
      videoId: video.id.videoId,
      title: video.snippet.title,
      channelTitle: video.snippet.channelTitle,
      thumbnail: video.snippet.thumbnails.medium?.url
    })
  } catch (err) {
    res.status(500).json({ error: 'YouTube search failed' })
  }
}
