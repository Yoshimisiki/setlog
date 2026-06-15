export interface ITunesTrack {
  trackId: number
  trackName: string
  artistName: string
  trackTimeMillis?: number
  previewUrl?: string
  trackViewUrl?: string
  artworkUrl60?: string
}

export async function searchITunes(query: string): Promise<ITunesTrack[]> {
  const res = await fetch(`/api/itunes/search?q=${encodeURIComponent(query)}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []) as ITunesTrack[]
}

export async function lookupITunesByArtistId(artistId: string): Promise<ITunesTrack[]> {
  const res = await fetch(`/api/itunes/lookup?id=${encodeURIComponent(artistId)}`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []) as ITunesTrack[]
}

export function extractArtistId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/\/(\d{6,})(?:[?#].*)?$/)
  return match ? match[1] : null
}
