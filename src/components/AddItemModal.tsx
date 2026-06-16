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
import { Loader2, Music, X, SlidersHorizontal } from 'lucide-react'
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

// ④ 検索クエリをアーティスト・曲名から合成
function buildQuery(artist: string, song: string, unified: string, detailed: boolean): string {
  if (!detailed) return unified
  const parts = [artist.trim(), song.trim()].filter(Boolean)
  return parts.join(' ')
}

export default function AddItemModal({ open, onClose, itemType, editItem, onSave }: Props) {
  const t = useTranslations('addItem')
  const tc = useTranslations('common')

  // フォーム状態
  const [title, setTitle]               = useState('')
  const [artist, setArtist]             = useState('')
  const [duration, setDuration]         = useState('')
  const [note, setNote]                 = useState('')
  const [deezerId, setDeezerId]         = useState('')
  const [previewUrl, setPreviewUrl]     = useState('')
  const [appleMusicUrl, setAppleMusicUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl]     = useState('') // 表示用フルURL、保存時にIDのみ抽出

  // 検索状態
  const [searchInput, setSearchInput]         = useState('')
  const [searchArtist, setSearchArtist]       = useState('')  // ④
  const [searchSong, setSearchSong]           = useState('')  // ④
  const [detailedSearch, setDetailedSearch]   = useState(false) // ④
  const [dropdown, setDropdown]               = useState<TrackResult[]>([])
  const [dropdownOpen, setDropdownOpen]       = useState(false)
  const [searching, setSearching]             = useState(false)
  const [selectedTrack, setSelectedTrack]     = useState<TrackResult | null>(null)

  const [showArtistIdInput, setShowArtistIdInput] = useState(false)
  const [artistIdInput, setArtistIdInput]         = useState('')
  const [artistIdSearching, setArtistIdSearching] = useState(false)

  // ① キーボード高さ検知（visualViewport API）
  const [kbHeight, setKbHeight] = useState(0)
  const [vpHeight, setVpHeight] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    setVpHeight(vv.height)
    const update = () => {
      const kh = Math.max(0, window.innerHeight - vv.offsetTop - vv.height)
      setKbHeight(kh)
      setVpHeight(vv.height)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef   = useRef<HTMLDivElement>(null)

  // ② ドロップダウンスクロール検知
  const dropdownScrolling    = useRef(false)
  const dropdownTouchStartY  = useRef(0)

  const labelMap: Record<ItemType, string> = {
    song: editItem ? t('editSong') : t('addSong'),
    mc:   editItem ? t('editMC')   : t('addMC'),
    se:   editItem ? t('editSE')   : t('addSE'),
  }

  useEffect(() => {
    if (!open) return

    setShowArtistIdInput(false)
    setArtistIdInput('')
    setDetailedSearch(false)
    setSearchArtist('')
    setSearchSong('')

    if (editItem) {
      setTitle(editItem.title)
      setArtist(editItem.artist ?? '')
      setDuration(editItem.duration_seconds > 0 ? formatSeconds(editItem.duration_seconds) : '')
      setNote(editItem.note ?? '')
      setDeezerId(editItem.deezer_id ?? '')
      setPreviewUrl(editItem.preview_url ?? '')
      setAppleMusicUrl(editItem.apple_music_url ?? '')
      setYoutubeUrl(editItem.youtube_id ? `https://www.youtube.com/watch?v=${editItem.youtube_id}` : '')
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
      setYoutubeUrl('')
      setSelectedTrack(null)
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

  // ② 各API 5秒タイムアウト（lib側に実装済み）、エラー時もfinally でローディング解除
  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setDropdown([])
      setDropdownOpen(false)
      setShowArtistIdInput(false)
      setSearching(false)
      return
    }
    setSearching(true)
    try {
      // Step 1: Deezer
      const deezerTracks = await searchTracks(query).catch(() => [])
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

      // Step 2: MusicBrainz（日本語はスキップ）
      const isJP = /[぀-ゟ゠-ヿ一-鿿]/.test(query)
      if (!isJP) {
        const mbTracks = await searchMusicBrainz(query).catch(() => [])
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
      }

      // Step 3: iTunes
      const itunesTracks = await searchITunes(query).catch(() => [])
      if (itunesTracks.length > 0) {
        setDropdown(itunesTracks.map(itunesTrackToResult))
        setDropdownOpen(true)
        setShowArtistIdInput(false)
        return
      }

      // Step 4: 全滅 → artistId入力UI
      setDropdown([])
      setDropdownOpen(false)
      setShowArtistIdInput(true)
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setDropdown([])
      setDropdownOpen(false)
      setShowArtistIdInput(false)
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(() => {
      const q = buildQuery('', '', value, false)
      runSearch(q)
    }, 300)
  }, [runSearch])

  // ④ 詳細検索（アーティスト名 / 曲名 個別入力）
  const handleDetailedSearch = useCallback(() => {
    const q = buildQuery(searchArtist, searchSong, '', true)
    if (!q) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    runSearch(q)
  }, [searchArtist, searchSong, runSearch])

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
    setSearchArtist('')
    setSearchSong('')
    setDropdown([])
    setDropdownOpen(false)
    setShowArtistIdInput(false)
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const handleYoutubeChange = async (url: string) => {
    setYoutubeUrl(url)
    const videoId = extractVideoId(url)
    if (!videoId) return
    try {
      const res = await fetch(`/api/youtube/info?url=${encodeURIComponent(url)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.title) setTitle(data.title)
      if (data.duration_seconds) {
        const m = Math.floor(data.duration_seconds / 60)
        const s = data.duration_seconds % 60
        setDuration(`${m}:${s.toString().padStart(2, '0')}`)
      }
    } catch {}
  }

  const clearSelectedTrack = () => {
    setSelectedTrack(null)
    setDeezerId('')
    setPreviewUrl('')
    setAppleMusicUrl('')
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(t('titleRequired'))
      return
    }
    // ⑤ 空欄は0秒として許容
    const secs = duration.trim() ? parseMMSS(duration) : 0

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
      youtube_id: extractVideoId(youtubeUrl.trim()) || undefined,
    })
    onClose()
  }

  // ① キーボード押し上げ用スタイル
  const dialogStyle: React.CSSProperties = {
    top: kbHeight > 0 ? `calc(50% - ${kbHeight / 2}px)` : undefined,
    maxHeight: vpHeight > 0 ? `${vpHeight - 48}px` : undefined,
    paddingBottom: `max(24px, env(safe-area-inset-bottom))`,
  }

  // ① スワイプでキーボードを閉じる（入力フィールド上では発動しない）
  const handleTouchStart = useRef<{ y: number; onInput: boolean } | null>(null)
  const handleTouchStartFn = (e: React.TouchEvent) => {
    const tag = (e.target as HTMLElement).tagName
    handleTouchStart.current = {
      y: e.touches[0].clientY,
      onInput: tag === 'INPUT' || tag === 'TEXTAREA',
    }
  }
  const handleTouchMoveFn = (e: React.TouchEvent) => {
    if (!handleTouchStart.current) return
    if (handleTouchStart.current.onInput) return
    const dy = e.touches[0].clientY - handleTouchStart.current.y
    if (dy > 20) {
      const el = document.activeElement
      if (el instanceof HTMLElement) el.blur()
    }
  }

  const showSearch = hasSearch(itemType)
  const isMC = itemType === 'mc'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {/* ① ③ キーボード対応・セーフエリア対応 */}
      <DialogContent
        className="bg-card border-border max-w-md w-full overflow-y-auto"
        style={dialogStyle}
        onTouchStart={handleTouchStartFn}
        onTouchMove={handleTouchMoveFn}
      >
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
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-primary">{t('searchDeezer')}</p>
                {/* ④ 詳細検索トグル */}
                {!selectedTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailedSearch((v) => !v)
                      setDropdown([])
                      setDropdownOpen(false)
                    }}
                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      detailedSearch
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5" />
                    詳細
                  </button>
                )}
              </div>

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
                  {/* ③ タップ領域 44px */}
                  <button
                    onClick={clearSelectedTrack}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0 w-11 h-11 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : detailedSearch ? (
                /* ④ 詳細検索UI */
                <div className="space-y-2">
                  <Input
                    value={searchArtist}
                    onChange={(e) => setSearchArtist(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDetailedSearch() }}
                    placeholder="アーティスト名"
                    className="bg-input border-primary/40 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground h-11 text-base"
                    autoComplete="off"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Input
                      value={searchSong}
                      onChange={(e) => setSearchSong(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleDetailedSearch() }}
                      placeholder="曲名（省略可）"
                      className="bg-input border-primary/40 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground h-11 text-base flex-1"
                      autoComplete="off"
                    />
                    <Button
                      onClick={handleDetailedSearch}
                      disabled={(!searchArtist.trim() && !searchSong.trim()) || searching}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 flex-shrink-0"
                    >
                      {searching
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : '検索'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* 通常検索UI */
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
                </>
              )}

              {/* 検索結果ドロップダウン */}
              {dropdownOpen && dropdown.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-xl divide-y divide-border max-h-64 overflow-y-auto"
                  onTouchStart={(e) => {
                    dropdownScrolling.current = false
                    dropdownTouchStartY.current = e.touches[0].clientY
                  }}
                  onTouchMove={(e) => {
                    if (Math.abs(e.touches[0].clientY - dropdownTouchStartY.current) > 8) {
                      dropdownScrolling.current = true
                    }
                  }}
                >
                  {dropdown.map((result) => (
                    <button
                      key={`${result.source}-${result.id}`}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 active:bg-secondary transition-colors text-left min-h-[44px]"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectTrack(result) }}
                      onTouchEnd={(e) => { e.preventDefault(); if (!dropdownScrolling.current) handleSelectTrack(result) }}
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
            </div>
          )}

          {/* artistId lookup */}
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
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11 text-sm flex-1"
                />
                <Button
                  onClick={handleArtistIdLookup}
                  disabled={!artistIdInput.trim() || artistIdSearching}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 flex-shrink-0"
                >
                  {artistIdSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '検索'}
                </Button>
              </div>
            </div>
          )}

          {/* Manual input */}
          <div>
            <div className="space-y-2.5 pl-1 border-l-2 border-border">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {showSearch ? t('songTitle') : t('titleLabel')}
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isMC ? 'MC' : ''}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11 text-base"
                  />
                </div>

                {!isMC && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('artistName')}</Label>
                    <Input
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder={t('bandName')}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11 text-base"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('time')}
                    {(selectedTrack?.source === 'musicbrainz' || selectedTrack?.source === 'itunes') && (
                      <span className="ml-1.5 text-yellow-500/80 font-normal">（不正確な場合があります）</span>
                    )}
                    {/* ⑤ 空欄許容の案内 */}
                    <span className="ml-1.5 text-muted-foreground/50 font-normal">（空欄=0秒）</span>
                  </Label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="MM:SS"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono h-11 text-base"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">YouTube URL（任意）</Label>
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => handleYoutubeChange(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11 text-base"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('memo')}</Label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('memoPlaceholder')}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11 text-base"
                  />
                </div>
            </div>
          </div>

          {/* ③ ボタン 44px */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-border text-foreground h-11" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11" onClick={handleSave}>
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
