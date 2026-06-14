import { NextRequest, NextResponse } from 'next/server'

const TIMEOUT_MS = 5000

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'no url' }, { status: 400 })

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return NextResponse.json({ error: 'localhost not supported' }, { status: 400 })
  }

  for (const shorten of [tryTinyUrl, tryShrtco, tryIsGd]) {
    const short = await shorten(url)
    if (short) return NextResponse.json({ short })
  }

  return NextResponse.json({ error: 'failed' }, { status: 502 })
}

async function tryTinyUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      {
        headers: { 'User-Agent': 'SETLOG/1.0 (https://setlog.yowofuru.com)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )
    if (!res.ok) return null
    const text = (await res.text()).trim()
    return text.startsWith('https://tinyurl.com/') ? text : null
  } catch (e) {
    console.error('[shorten] tinyurl failed:', e)
    return null
  }
}

async function tryShrtco(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`,
      {
        headers: { 'User-Agent': 'SETLOG/1.0 (https://setlog.yowofuru.com)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.ok ? (data.result?.full_short_link ?? null) : null
  } catch (e) {
    console.error('[shorten] shrtco failed:', e)
    return null
  }
}

async function tryIsGd(url: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
      {
        headers: { 'User-Agent': 'SETLOG/1.0 (https://setlog.yowofuru.com)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )
    if (!res.ok) return null
    const text = (await res.text()).trim()
    return text.startsWith('http') ? text : null
  } catch (e) {
    console.error('[shorten] is.gd failed:', e)
    return null
  }
}
