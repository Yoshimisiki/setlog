import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ results: [] })

  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=10&country=JP`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return NextResponse.json({ results: [] }, { status: 502 })
  const data = await res.json()
  return NextResponse.json(data)
}
