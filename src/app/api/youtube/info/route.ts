import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
  if (!videoId) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  // ① YouTube Data API v3（APIキーがある場合）
  const apiKey = process.env.YOUTUBE_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`
      )
      if (res.ok) {
        const data = await res.json()
        const item = data.items?.[0]
        if (item) {
          const iso = item.contentDetails.duration // "PT4M33S"
          const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
          const duration_seconds =
            (parseInt(m?.[1] ?? '0') * 3600) +
            (parseInt(m?.[2] ?? '0') * 60) +
            (parseInt(m?.[3] ?? '0'))
          return NextResponse.json({
            title: item.snippet.title,
            duration_seconds: duration_seconds > 0 ? duration_seconds : null,
          })
        }
      }
    } catch {}
  }

  // ② フォールバック: oEmbed（タイトルのみ）
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': 'SETLOG/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ title: data.title ?? '', duration_seconds: null })
    }
  } catch {}

  return NextResponse.json({ title: null, duration_seconds: null })
}
