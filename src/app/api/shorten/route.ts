import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'no url' }, { status: 400 })

  // Skip shortening for localhost (no external service will shorten local URLs)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return NextResponse.json({ error: 'localhost not supported' }, { status: 400 })
  }

  try {
    // is.gd: direct redirect (no preview page), free, no auth required
    const res = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
      {
        headers: { 'User-Agent': 'SETLOG/1.0' },
        cache: 'no-store',
      }
    )
    const text = (await res.text()).trim()
    if (!text.startsWith('http')) throw new Error(`is.gd error: ${text.slice(0, 100)}`)
    return NextResponse.json({ short: text })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
