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
  const res = await fetch(`/api/itunes/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []) as ITunesTrack[]
}

export async function lookupITunesByArtistId(artistId: string): Promise<ITunesTrack[]> {
  const res = await fetch(`/api/itunes/lookup?id=${encodeURIComponent(artistId)}`)
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
