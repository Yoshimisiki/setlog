import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
  if (!videoId) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  let fallbackTitle: string | null = null

  // ① noembed.com
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      { headers: { 'User-Agent': 'SETLOG/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      fallbackTitle = data.title ?? null
      if (data.duration) {
        const m = data.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (m) {
          const h = parseInt(m[1] ?? '0')
          const min = parseInt(m[2] ?? '0')
          const s = parseInt(m[3] ?? '0')
          const duration_seconds = h * 3600 + min * 60 + s
          if (duration_seconds > 0) {
            return NextResponse.json({ title: fallbackTitle, duration_seconds })
          }
        }
      }
    }
  } catch {}

  // ② youtube.com/watch ページスクレイピング
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SETLOG/1.0)',
        'Accept-Language': 'ja-JP',
      },
    })
    if (pageRes.ok) {
      const html = await pageRes.text()
      const durationMatch = html.match(/"lengthSeconds":"(\d+)"/)
      const titleMatch = html.match(/"title":"([^"]+)"/)
      if (durationMatch) {
        const duration_seconds = parseInt(durationMatch[1])
        const title = titleMatch ? titleMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/') : fallbackTitle
        return NextResponse.json({ title, duration_seconds })
      }
      if (titleMatch && !fallbackTitle) {
        fallbackTitle = titleMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
      }
    }
  } catch {}

  // ③ フォールバック: oEmbed でタイトルのみ
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': 'SETLOG/1.0' } }
    )
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ title: data.title ?? fallbackTitle, duration_seconds: null })
    }
  } catch {}

  return NextResponse.json({ title: fallbackTitle, duration_seconds: null })
}
