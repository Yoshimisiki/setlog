'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListMusic, MapPin, Calendar, Clock, ExternalLink, Play, Pause, Square } from 'lucide-react'
import { SiSpotify, SiApplemusic, SiYoutubemusic } from 'react-icons/si'
import { formatSeconds, decodeSetlist, cn } from '@/lib/utils'
import { saveCurrentSetlist } from '@/lib/storage'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import type { Setlist, SetlistItem } from '@/types'
import AdBanner from '@/components/AdBanner'
import AppFooter from '@/components/AppFooter'

const typeIcon: Record<string, string> = {
  song: '🎵', mc: '🎤', se: '🔊',
}

function getStreamLinks(item: SetlistItem) {
  if (item.type !== 'song') return null
  const q = encodeURIComponent([item.title, item.artist].filter(Boolean).join(' '))
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    appleMusic: `https://music.apple.com/search?term=${q}`,
    youtubeMusic: `https://music.youtube.com/search?q=${q}`,
  }
}

export default function PublicPage() {
  const t = useTranslations('public')
  const tc = useTranslations('common')
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [error, setError] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) { setError(true); return }
    const decoded = decodeSetlist<Setlist>(hash)
    if (!decoded) { setError(true); return }
    setSetlist(decoded)
  }, [])

  const playPreview = (item: SetlistItem) => {
    if (!item.preview_url) return
    if (playingId === item.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = item.preview_url
    } else {
      audioRef.current = new Audio(item.preview_url)
    }
    audioRef.current.onended = () => setPlayingId(null)
    audioRef.current.play()
    setPlayingId(item.id)
  }

  const stopAll = () => {
    audioRef.current?.pause()
    setPlayingId(null)
  }

  const handleEditBase = () => {
    if (!setlist) return
    saveCurrentSetlist(setlist)
    window.location.href = '/editor'
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ListMusic className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">{t('notFound')}</h1>
        <p className="text-muted-foreground text-sm">{t('notFoundDesc')}</p>
        <Button asChild className="bg-primary text-primary-foreground">
          <Link href="/editor">{t('createSetlist')}</Link>
        </Button>
      </div>
    )
  }

  if (!setlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">{t('loading')}</div>
      </div>
    )
  }

  const totalSeconds = setlist.items.reduce((s, i) => s + i.duration_seconds, 0)
  const hasPreview = setlist.items.some((i) => i.preview_url)

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-4 h-14 flex items-center justify-between max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">{tc('appName')}</span>
        </Link>
        <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground text-xs">
          <Link href="/editor">{t('createSetlist')}</Link>
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          {setlist.band_name && (
            <p className="text-primary font-semibold">{setlist.band_name}</p>
          )}
          <h1 className="text-2xl font-bold text-foreground">{setlist.title || 'Setlist'}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
            {setlist.venue_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {setlist.venue_url ? (
                  <a href={setlist.venue_url} target="_blank" rel="noopener noreferrer"
                    className="hover:text-primary flex items-center gap-0.5">
                    {setlist.venue_name}<ExternalLink className="w-3 h-3" />
                  </a>
                ) : setlist.venue_name}
              </span>
            )}
            {setlist.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(setlist.event_date), 'yyyy年M月d日', { locale: ja })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t('total')} {formatSeconds(totalSeconds)}
            </span>
          </div>
        </div>

        {hasPreview && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-border text-foreground gap-1"
              onClick={stopAll} disabled={!playingId}>
              <Square className="w-3 h-3" />{t('stop')}
            </Button>
            <span className="text-xs text-muted-foreground">{t('previewHint')}</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {setlist.items.map((item, idx) => {
            const links = getStreamLinks(item)
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-muted-foreground text-xs font-mono w-5 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-lg flex-shrink-0">{typeIcon[item.type] ?? '🎵'}</span>

                <div className="flex-1 min-w-0">
                  <span className={cn('text-sm', item.type !== 'song' && 'text-muted-foreground')}>
                    {item.title}
                  </span>
                  {item.artist && (
                    <p className="text-xs text-muted-foreground">{item.artist}</p>
                  )}
                  {links && (
                    <div className="flex items-center gap-2 mt-1.5">
                      {item.deezer_id && (
                        <a href={`https://www.deezer.com/track/${item.deezer_id}`}
                          target="_blank" rel="noopener noreferrer"
                          title="Deezer"
                          className="w-6 h-6 rounded-full bg-[#9f10bc]/20 flex items-center justify-center hover:bg-[#9f10bc]/40 transition-colors flex-shrink-0"
                        >
                          <span className="text-[9px] font-bold text-[#9f10bc]">D</span>
                        </a>
                      )}
                      <a href={links.spotify} target="_blank" rel="noopener noreferrer"
                        title="Spotify で検索"
                        className="text-[#1DB954] hover:opacity-70 transition-opacity flex-shrink-0">
                        <SiSpotify className="w-5 h-5" />
                      </a>
                      <a href={links.appleMusic} target="_blank" rel="noopener noreferrer"
                        title="Apple Music で検索"
                        className="text-pink-400 hover:opacity-70 transition-opacity flex-shrink-0">
                        <SiApplemusic className="w-5 h-5" />
                      </a>
                      <a href={links.youtubeMusic} target="_blank" rel="noopener noreferrer"
                        title="YouTube Music で検索"
                        className="text-red-400 hover:opacity-70 transition-opacity flex-shrink-0">
                        <SiYoutubemusic className="w-5 h-5" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.preview_url && (
                    <button
                      onClick={() => playPreview(item)}
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                        playingId === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {playingId === item.id
                        ? <Pause className="w-3 h-3" />
                        : <Play className="w-3 h-3 ml-0.5" />}
                    </button>
                  )}
                  <span className="text-muted-foreground text-xs font-mono">
                    {formatSeconds(item.duration_seconds)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleEditBase}
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            {t('editBase')}
          </Button>
        </div>

        <AdBanner />
      </main>
      <AppFooter />
    </div>
  )
}
