import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ results: [] })

  const base = `https://itunes.apple.com/search?entity=musicTrack&country=JP&limit=10`
  const term = encodeURIComponent(q)

  const [byArtist, bySong] = await Promise.all([
    fetch(`${base}&attribute=artistTerm&term=${term}`, { next: { revalidate: 60 } }),
    fetch(`${base}&attribute=songTerm&term=${term}`,   { next: { revalidate: 60 } }),
  ])

  const [artistData, songData] = await Promise.all([
    byArtist.ok ? byArtist.json() : { results: [] },
    bySong.ok   ? bySong.json()   : { results: [] },
  ])

  const seen = new Set<number>()
  const merged: unknown[] = []
  for (const track of [...(artistData.results ?? []), ...(songData.results ?? [])]) {
    const id = (track as { trackId: number }).trackId
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(track)
    }
  }

  return NextResponse.json({ results: merged })
}
