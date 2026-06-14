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
  const res = await fetch(`/api/itunes?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []) as ITunesTrack[]
}
