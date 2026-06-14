'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseMMSS, formatSeconds } from '@/lib/utils'
import { searchTracks } from '@/lib/deezer'
import { Loader2, Music, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import { useTranslations } from 'next-intl'

import type { SetlistItem, ItemType, DeezerTrack } from '@/types'

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

export default function AddItemModal({ open, onClose, itemType, editItem, onSave }: Props) {
  const t = useTranslations('addItem')
  const tc = useTranslations('common')
  const [title, setTitle]           = useState('')
  const [artist, setArtist]         = useState('')
  const [duration, setDuration]     = useState('')
  const [note, setNote]             = useState('')
  const [deezerId, setDeezerId]     = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [manualOpen, setManualOpen] = useState(false)

  const [searchInput, setSearchInput]     = useState('')
  const [dropdown, setDropdown]           = useState<DeezerTrack[]>([])
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [searching, setSearching]         = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<DeezerTrack | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef   = useRef<HTMLDivElement>(null)

  const labelMap: Record<ItemType, string> = {
    song: editItem ? t('editSong') : t('addSong'),
    mc:   editItem ? t('editMC')   : t('addMC'),
    se:   editItem ? t('editSE')   : t('addSE'),
  }

  useEffect(() => {
    if (!open) return

    if (editItem) {
      setTitle(editItem.title)
      setArtist(editItem.artist ?? '')
      setDuration(formatSeconds(editItem.duration_seconds))
      setNote(editItem.note ?? '')
      setDeezerId(editItem.deezer_id ?? '')
      setPreviewUrl(editItem.preview_url ?? '')
      setManualOpen(true)
      if (editItem.deezer_id) {
        setSelectedTrack({
          id: Number(editItem.deezer_id),
          title: editItem.title,
          artist: { name: editItem.artist ?? '' },
          album: { cover_small: '', cover_medium: '' },
          duration: editItem.duration_seconds,
          preview: editItem.preview_url ?? '',
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
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const tracks = await searchTracks(value)
        setDropdown(tracks)
        setDropdownOpen(tracks.length > 0)
      } catch {
        toast.error('Deezer検索に失敗しました')
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleSelectTrack = (track: DeezerTrack) => {
    setSelectedTrack(track)
    setTitle(track.title)
    setArtist(track.artist.name)
    setDuration(formatSeconds(track.duration))
    setDeezerId(String(track.id))
    setPreviewUrl(track.preview)
    setManualOpen(true)
    setSearchInput('')
    setDropdown([])
    setDropdownOpen(false)
  }

  const clearSelectedTrack = () => {
    setSelectedTrack(null)
    setDeezerId('')
    setPreviewUrl('')
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
        </DialogHeader>

        <div className="space-y-4">

          {/* Deezer search (primary) */}
          {showSearch && (
            <div ref={searchRef} className="relative">
              <p className="text-xs font-medium text-primary mb-1.5">{t('searchDeezer')}</p>

              {selectedTrack ? (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-3 py-3">
                  {selectedTrack.album.cover_small && (
                    <img src={selectedTrack.album.cover_small} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{selectedTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist.name}</p>
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
                      {dropdown.map((track) => (
                        <button
                          key={track.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectTrack(track)
                          }}
                        >
                          {track.album.cover_small ? (
                            <img src={track.album.cover_small} alt="" className="w-9 h-9 rounded flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                              <Music className="w-3 h-3 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                            {formatSeconds(track.duration)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
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
                  <Label className="text-xs text-muted-foreground">{t('time')}</Label>
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
