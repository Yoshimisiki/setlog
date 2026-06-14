export type ItemType = 'song' | 'mc' | 'se'

export interface SetlistItem {
  id: string
  type: ItemType
  title: string
  artist?: string
  duration_seconds: number
  deezer_id?: string
  preview_url?: string
  note?: string
}

export interface Setlist {
  title: string
  band_name: string
  venue_name?: string
  venue_url?: string
  event_date?: string
  target_seconds: number
  items: SetlistItem[]
  created_at: string
}

export interface DeezerTrack {
  id: number
  title: string
  artist: { name: string }
  album: { cover_small: string; cover_medium: string }
  duration: number  // seconds
  preview: string
}
