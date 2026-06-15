import { NextRequest, NextResponse } from 'next/server'

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

function isJapanese(str: string): boolean {
  return /[぀-ゟ゠-ヿ一-鿿]/.test(str)
}

function dedup(tracks: unknown[]): unknown[] {
  const seen = new Set<number>()
  return tracks.filter((t) => {
    const id = (t as { trackId: number }).trackId
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function searchByTerm(term: string): Promise<unknown[]> {
  const base = `https://itunes.apple.com/search?entity=musicTrack&country=JP&limit=10`
  const encoded = encodeURIComponent(term)
  const [byArtist, bySong] = await Promise.all([
    fetch(`${base}&attribute=artistTerm&term=${encoded}`, { next: { revalidate: 60 } }),
    fetch(`${base}&attribute=songTerm&term=${encoded}`,   { next: { revalidate: 60 } }),
  ])
  const [a, s] = await Promise.all([
    byArtist.ok ? byArtist.json() : { results: [] },
    bySong.ok   ? bySong.json()   : { results: [] },
  ])
  return [...(a.results ?? []), ...(s.results ?? [])]
}

async function lookupByArtistId(artistId: string): Promise<unknown[]> {
  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${artistId}&entity=song&country=JP&limit=25`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []).filter(
    (r: unknown) => (r as { wrapperType?: string }).wrapperType === 'track'
  )
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ results: [] })

  let allTracks: unknown[]

  if (isJapanese(q)) {
    const hiragana = katakanaToHiragana(q)
    const terms = hiragana !== q ? [q, hiragana] : [q]

    const searchResults = await Promise.all(terms.map(searchByTerm))
    const merged = dedup(searchResults.flat())

    const artistIdCounts = new Map<number, number>()
    for (const t of merged) {
      const aid = (t as { artistId?: number }).artistId
      if (aid) artistIdCounts.set(aid, (artistIdCounts.get(aid) ?? 0) + 1)
    }
    const topArtistId = [...artistIdCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]

    if (topArtistId) {
      const lookupTracks = await lookupByArtistId(String(topArtistId))
      allTracks = dedup([...merged, ...lookupTracks])
    } else {
      allTracks = merged
    }
  } else {
    allTracks = dedup(await searchByTerm(q))
  }

  return NextResponse.json({ results: allTracks })
}
