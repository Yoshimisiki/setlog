import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ recordings: [] })

  const res = await fetch(
    `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&fmt=json&limit=8`,
    {
      headers: {
        'User-Agent': 'SETLOG/1.0 (https://setlog.yowofuru.com)',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    }
  )
  if (!res.ok) return NextResponse.json({ recordings: [] }, { status: 502 })
  const data = await res.json()
  return NextResponse.json(data)
}
