import type { DeezerTrack } from '@/types'

export type { DeezerTrack }

export async function searchTracks(query: string): Promise<DeezerTrack[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.data ?? []) as DeezerTrack[]
}
