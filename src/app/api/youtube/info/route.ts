import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
  if (!videoId) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': 'SETLOG/1.0 (https://setlog.yowofuru.com)' } }
    )
    if (!res.ok) return NextResponse.json({ error: 'oembed failed' }, { status: 502 })
    const data = await res.json()
    return NextResponse.json({
      title: data.title ?? '',
      duration_seconds: null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
