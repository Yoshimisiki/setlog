import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yt = require('youtube-search-without-api-key')

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
  } catch {}
  return null
}

function parseDuration(raw: string): number {
  const parts = raw.split(':').map(Number).reverse()
  return (parts[0] ?? 0) + (parts[1] ?? 0) * 60 + (parts[2] ?? 0) * 3600
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const videoId = extractVideoId(url)
  if (!videoId) return NextResponse.json({ error: 'invalid url' }, { status: 400 })

  try {
    const results = await yt.search(videoId)
    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    const r = results[0]
    return NextResponse.json({
      title: r.title ?? '',
      duration_seconds: r.duration_raw ? parseDuration(r.duration_raw) : 0,
    })
  } catch {
    return NextResponse.json({ error: 'search failed' }, { status: 500 })
  }
}
