import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'no url' }, { status: 400 })

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return NextResponse.json({ error: 'localhost not supported' }, { status: 400 })
  }

  // Try TinyURL first, then is.gd as fallback
  for (const shorten of [tryTinyUrl, tryIsGd]) {
    const short = await shorten(url)
    if (short) return NextResponse.json({ short })
  }

  return NextResponse.json({ error: 'failed' }, { status: 502 })
}

async function tryTinyUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'SETLOG/1.0' }, cache: 'no-store' }
    )
    const text = (await res.text()).trim()
    return text.startsWith('http') ? text : null
  } catch {
    return null
  }
}

async function tryIsGd(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
      { headers: { 'User-Agent': 'SETLOG/1.0' }, cache: 'no-store' }
    )
    const text = (await res.text()).trim()
    return text.startsWith('http') ? text : null
  } catch {
    return null
  }
}
