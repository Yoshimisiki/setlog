import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id?.trim()) return NextResponse.json({ results: [] })

  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=song&country=JP&limit=25`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return NextResponse.json({ results: [] }, { status: 502 })

  const data = await res.json()
  const tracks = (data.results ?? []).filter(
    (r: unknown) => (r as { wrapperType?: string }).wrapperType === 'track'
  )
  return NextResponse.json({ results: tracks })
}
