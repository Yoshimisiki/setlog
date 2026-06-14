export interface MusicBrainzTrack {
  id: string
  title: string
  artist: string
  duration_seconds: number
}

export async function searchMusicBrainz(query: string): Promise<MusicBrainzTrack[]> {
  const res = await fetch(`/api/musicbrainz?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  const recordings: Array<Record<string, unknown>> = data.recordings ?? []
  return recordings.map((r) => {
    const credits = r['artist-credit'] as Array<{ name?: string; artist?: { name?: string } }> | undefined
    const artist = credits?.[0]?.name ?? credits?.[0]?.artist?.name ?? ''
    const lengthMs = typeof r.length === 'number' ? r.length : 0
    return {
      id: String(r.id),
      title: String(r.title),
      artist,
      duration_seconds: lengthMs > 0 ? Math.round(lengthMs / 1000) : 0,
    }
  })
}
