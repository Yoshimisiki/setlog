'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseMMSS, formatSeconds } from '@/lib/utils'
import { searchTracks } from '@/lib/deezer'
import { searchMusicBrainz } from '@/lib/musicbrainz'
import { searchITunes, lookupITunesByArtistId, extractArtistId, type ITunesTrack } from '@/lib/itunes'
import { Loader2, Music, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import { useTranslations } from 'next-intl'

import type { SetlistItem, ItemType } from '@/types'

interface TrackResult {
  source: 'deezer' | 'musicbrainz' | 'itunes'
  id: string
  title: string
  artist: string
  duration_seconds: number
  cover_url?: string
  preview_url?: string
  apple_music_url?: string
}

interface Props {
  open: boolean
  onClose: () => void
  itemType: ItemType
  editItem: SetlistItem | null
  onSave: (item: SetlistItem) => void
}

const defaults: Record<ItemType, { title: string; duration: string }> = {
  song: { title: '', duration: '' },
  mc:   { title: 'MC', duration: '2:00' },
  se:   { title: 'SE', duration: '0:30' },
}

const hasSearch = (type: ItemType) => type === 'song' || type === 'se'

function itunesTrackToResult(t: ITunesTrack): TrackResult {
  return {
    source: 'itunes',
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    duration_seconds: t.trackTimeMillis ? Math.floor(t.trackTimeMillis / 1000) : 0,
    cover_url: t.artworkUrl60,
    preview_url: t.previewUrl,
    apple_music_url: t.trackViewUrl,
  }
}

export default function AddItemModal({ open, onClose, itemType, editItem, onSave }: Props) {
  const t = useTranslations('addItem')
  const tc = useTranslations('common')
  const [title, setTitle]               = useState('')
  const [artist, setArtist]             = useState('')
  const [duration, setDuration]         = useState('')
  const [note, setNote]                 = useState('')
  const [deezerId, setDeezerId]         = useState('')
  const [previewUrl, setPreviewUrl]     = useState('')
  const [appleMusicUrl, setAppleMusicUrl] = useState('')
  const [manualOpen, setManualOpen]     = useState(false)

  const [searchInput, setSearchInput]         = useState('')
  const [dropdown, setDropdown]               = useState<TrackResult[]>([])
  const [dropdownOpen, setDropdownOpen]       = useState(false)
  const [searching, setSearching]             = useState(false)
  const [selectedTrack, setSelectedTrack]     = useState<TrackResult | null>(null)

  const [showArtistIdInput, setShowArtistIdInput] = useState(false)
  const [artistIdInput, setArtistIdInput]         = useState('')
  const [artistIdSearching, setArtistIdSearching] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef   = useRef<HTMLDivElement>(null)

  const labelMap: Record<ItemType, string> = {
    song: editItem ? t('editSong') : t('addSong'),
    mc:   editItem ? t('editMC')   : t('addMC'),
    se:   editItem ? t('editSE')   : t('addSE'),
  }

  useEffect(() => {
    if (!open) return

    setShowArtistIdInput(false)
    setArtistIdInput('')

    if (editItem) {
      setTitle(editItem.title)
      setArtist(editItem.artist ?? '')
      setDuration(formatSeconds(editItem.duration_seconds))
      setNote(editItem.note ?? '')
      setDeezerId(editItem.deezer_id ?? '')
      setPreviewUrl(editItem.preview_url ?? '')
      setAppleMusicUrl(editItem.apple_music_url ?? '')
      setManualOpen(true)
      if (editItem.deezer_id) {
        setSelectedTrack({
          source: 'deezer',
          id: editItem.deezer_id,
          title: editItem.title,
          artist: editItem.artist ?? '',
          duration_seconds: editItem.duration_seconds,
          preview_url: editItem.preview_url,
        })
      } else {
        setSelectedTrack(null)
      }
    } else {
      setTitle(defaults[itemType].title)
      setDuration(defaults[itemType].duration)
      setArtist('')
      setNote('')
      setDeezerId('')
      setPreviewUrl('')
      setAppleMusicUrl('')
      setSelectedTrack(null)
      setManualOpen(itemType === 'mc')
    }
    setSearchInput('')
    setDropdown([])
    setDropdownOpen(false)
  }, [open, editItem, itemType])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setDropdown([])
      setDropdownOpen(false)
      setShowArtistIdInput(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        // Step 1: Deezer
        const deezerTracks = await searchTracks(value)
        if (deezerTracks.length > 0) {
          setDropdown(deezerTracks.map((t) => ({
            source: 'deezer' as const,
            id: String(t.id),
            title: t.title,
            artist: t.artist.name,
            duration_seconds: t.duration,
            cover_url: t.album.cover_small,
            preview_url: t.preview,
          })))
          setDropdownOpen(true)
          setShowArtistIdInput(false)
          return
        }

        // Step 2: MusicBrainz fallback
        const mbTracks = await searchMusicBrainz(value)
        if (mbTracks.length > 0) {
          setDropdown(mbTracks.map((t) => ({
            source: 'musicbrainz' as const,
            id: t.id,
            title: t.title,
            artist: t.artist,
            duration_seconds: t.duration_seconds,
          })))
          setDropdownOpen(true)
          setShowArtistIdInput(false)
          return
        }

        // Step 3: iTunes fallback (includes Japanese query transformation server-side)
        const itunesTracks = await searchITunes(value)
        if (itunesTracks.length > 0) {
          setDropdown(itunesTracks.map(itunesTrackToResult))
          setDropdownOpen(true)
          setShowArtistIdInput(false)
          return
        }

        // Step 4: all failed → show artistId input + open manual form
        setDropdown([])
        setDropdownOpen(false)
        setShowArtistIdInput(true)
        setManualOpen(true)
      } catch {
        toast.error('検索に失敗しました')
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleArtistIdLookup = useCallback(async () => {
    const id = extractArtistId(artistIdInput)
    if (!id) {
      toast.error('有効なArtistIDまたはApple Music URLを入力してください')
      return
    }
    setArtistIdSearching(true)
    try {
      const tracks = await lookupITunesByArtistId(id)
      if (tracks.length > 0) {
        setDropdown(tracks.map(itunesTrackToResult))
        setDropdownOpen(true)
        setShowArtistIdInput(false)
      } else {
        toast.error('楽曲が見つかりませんでした')
      }
    } catch {
      toast.error('検索に失敗しました')
    } finally {
      setArtistIdSearching(false)
    }
  }, [artistIdInput])

  const handleSelectTrack = (result: TrackResult) => {
    setSelectedTrack(result)
    setTitle(result.title)
    setArtist(result.artist)
    setDuration(result.duration_seconds > 0 ? formatSeconds(result.duration_seconds) : '')
    setManualOpen(true)

    if (result.source === 'deezer') {
      setDeezerId(result.id)
      setPreviewUrl(result.preview_url ?? '')
      setAppleMusicUrl('')
    } else if (result.source === 'itunes') {
      setDeezerId('')
      setPreviewUrl(result.preview_url ?? '')
      setAppleMusicUrl(result.apple_music_url ?? '')
    } else {
      setDeezerId('')
      setPreviewUrl('')
      setAppleMusicUrl('')
    }

    setSearchInput('')
    setDropdown([])
    setDropdownOpen(false)
    setShowArtistIdInput(false)
  }

  const clearSelectedTrack = () => {
    setSelectedTrack(null)
    setDeezerId('')
    setPreviewUrl('')
    setAppleMusicUrl('')
  }

  const handleSave = () => {
    if (!title.trim()) {
      setManualOpen(true)
      toast.error(t('titleRequired'))
      return
    }
    const secs = parseMMSS(duration)
    if (secs <= 0) {
      setManualOpen(true)
      toast.error(t('timeRequired'))
      return
    }

    onSave({
      id: editItem?.id ?? nanoid(8),
      type: itemType,
      title: title.trim(),
      artist: artist.trim() || undefined,
      duration_seconds: secs,
      note: note.trim() || undefined,
      deezer_id: deezerId || undefined,
      preview_url: previewUrl || undefined,
      apple_music_url: appleMusicUrl || undefined,
    })
    onClose()
  }

  const showSearch = hasSearch(itemType)
  const isMC = itemType === 'mc'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {labelMap[itemType]}
          </DialogTitle>
          <DialogDescription className="sr-only">{labelMap[itemType]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* Search box */}
          {showSearch && (
            <div ref={searchRef} className="relative">
              <p className="text-xs font-medium text-primary mb-1.5">{t('searchDeezer')}</p>

              {selectedTrack ? (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-3 py-3">
                  {selectedTrack.cover_url ? (
                    <img src={selectedTrack.cover_url} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{selectedTrack.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist}</p>
                      <SourceBadge source={selectedTrack.source} />
                    </div>
                  </div>
                  <button
                    onClick={clearSelectedTrack}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Input
                      value={searchInput}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="bg-input border-primary/40 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground pr-9 h-11 text-base"
                      autoComplete="off"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {searching
                        ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        : <Music className="w-4 h-4 text-primary/50" />
                      }
                    </div>
                  </div>

                  {dropdownOpen && dropdown.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-xl divide-y divide-border max-h-64 overflow-y-auto">
                      {dropdown.map((result) => (
                        <button
                          key={`${result.source}-${result.id}`}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectTrack(result)
                          }}
                        >
                          {result.cover_url ? (
                            <img src={result.cover_url} alt="" className="w-9 h-9 rounded flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                              <Music className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.artist}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {result.duration_seconds > 0 && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatSeconds(result.duration_seconds)}
                              </span>
                            )}
                            <SourceBadge source={result.source} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* artistId lookup (shown when all APIs return 0 results) */}
          {showSearch && showArtistIdInput && !selectedTrack && (
            <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Apple MusicでアーティストページのURLを開き、末尾のIDを入力してください
              </p>
              <p className="text-[11px] text-muted-foreground/50 font-mono break-all">
                music.apple.com/jp/artist/名前/<span className="text-pink-400">1513117188</span>
              </p>
              <div className="flex gap-2">
                <Input
                  value={artistIdInput}
                  onChange={(e) => setArtistIdInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleArtistIdLookup() }}
                  placeholder="URLまたはArtistID（数字）"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleArtistIdLookup}
                  disabled={!artistIdInput.trim() || artistIdSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 flex-shrink-0"
                >
                  {artistIdSearching
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : '検索'}
                </Button>
              </div>
            </div>
          )}

          {/* Manual input (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {manualOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showSearch
                ? (selectedTrack ? t('editDetails') : t('noResultManual'))
                : t('titleLabel')}
            </button>

            {manualOpen && (
              <div className="mt-3 space-y-2.5 pl-1 border-l-2 border-border">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {showSearch ? t('songTitle') : t('titleLabel')}
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isMC ? 'MC' : ''}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
                  />
                </div>

                {!isMC && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('artistName')}</Label>
                    <Input
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder={t('bandName')}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('time')}
                    {(selectedTrack?.source === 'musicbrainz' || selectedTrack?.source === 'itunes') && (
                      <span className="ml-1.5 text-yellow-500/80 font-normal">（不正確な場合があります）</span>
                    )}
                  </Label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="3:45"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('memo')}</Label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('memoPlaceholder')}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-border text-foreground" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
              {editItem ? tc('update') : tc('add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SourceBadge({ source }: { source: 'deezer' | 'musicbrainz' | 'itunes' }) {
  if (source === 'deezer') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#9f10bc]/20 text-[#c44de8] flex-shrink-0">
        Deezer
      </span>
    )
  }
  if (source === 'musicbrainz') {
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 flex-shrink-0">
        MusicBrainz
      </span>
    )
  }
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 flex-shrink-0">
      iTunes
    </span>
  )
}
