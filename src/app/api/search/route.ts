import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ data: [] })

  const res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=10`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return NextResponse.json({ data: [] }, { status: 502 })
  const data = await res.json()
  return NextResponse.json(data)
}
