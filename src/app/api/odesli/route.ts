import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({})

  const res = await fetch(
    `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}`,
    { cache: 'no-store' }
  )

  if (!res.ok) {
    // Pass through the actual status so the client can handle rate limits etc.
    return NextResponse.json({ error: res.statusText }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
