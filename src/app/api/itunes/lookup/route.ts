import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id?.trim()) return NextResponse.json({ results: [] })

  const url = `https://itunes.apple.com/lookup?id=${id}&entity=song&country=JP&limit=25`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SETLOG/1.0 (https://setlog.yowofuru.com)' },
    cache: 'no-store',
  })
  console.log(`[itunes/lookup] id=${id} status=${res.status}`)
  if (!res.ok) return NextResponse.json({ results: [], status: res.status }, { status: 502 })

  const data = await res.json()
  const tracks = (data.results ?? []).filter(
    (r: unknown) => (r as { wrapperType?: string }).wrapperType === 'track'
  )
  return NextResponse.json({ results: tracks })
}
