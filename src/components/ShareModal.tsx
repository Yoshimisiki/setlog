'use client'

import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Twitter, ImageIcon, Check, Loader2 } from 'lucide-react'
import { encodeSetlist } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Setlist } from '@/types'
import ImageCustomizerModal from './ImageCustomizerModal'

interface Props {
  open: boolean
  onClose: () => void
  setlist: Setlist
}

export default function ShareModal({ open, onClose, setlist }: Props) {
  const t = useTranslations('share')
  const [copied, setCopied]         = useState(false)
  const [shareUrl, setShareUrl]     = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [customizerOpen, setCustomizerOpen] = useState(false)

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const fallbackUrl = `${appUrl}/s#${encodeSetlist(setlist)}`
  const displayUrl  = shareUrl ?? fallbackUrl

  useEffect(() => {
    if (!open) { setShareUrl(null); return }
    setSaving(true)
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: setlist }),
    })
      .then(r => r.json())
      .then(d => { if (d.id) setShareUrl(`${appUrl}/s/${d.id}`) })
      .catch(() => {})
      .finally(() => setSaving(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayUrl)
    setCopied(true)
    toast.success(t('copySuccess'))
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTwitter = () => {
    const dateStr = setlist.event_date
      ? format(new Date(setlist.event_date), 'yyyy/M/d')
      : ''
    const dateVenueStr = [dateStr, setlist.venue_name].filter(Boolean).join(' @ ')
    const songs = setlist.items.filter(i => i.type === 'song').map(i => i.title)
    const text = [
      `🎵Setlist from ${setlist.band_name}`,
      dateVenueStr,
      t('twitterStreamingLine'),
      ...songs,
      '#SETLOG #setlist',
    ].filter(Boolean).join('\n')
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(displayUrl)}`,
      '_blank', 'noopener,noreferrer'
    )
  }

  return (
    <>
      <Dialog open={open && !customizerOpen} onOpenChange={o => { if (!o && !customizerOpen) onClose() }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL */}
            <div className="bg-secondary rounded-lg p-3 flex items-center gap-2 min-h-[52px]">
              {saving ? (
                <div className="flex items-center gap-2 flex-1">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">URLを生成中...</span>
                </div>
              ) : (
                <code className="flex-1 text-xs text-foreground break-all line-clamp-2">{displayUrl}</code>
              )}
              <Button variant="ghost" size="icon"
                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopy} disabled={saving}>
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Share buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleTwitter} disabled={saving}
                className="w-full bg-[#1d9bf0] text-white hover:bg-[#1d9bf0]/90">
                <Twitter className="w-4 h-4 mr-2" />
                {t('twitterShare')}
              </Button>
              <Button variant="outline" disabled={saving}
                onClick={() => setCustomizerOpen(true)}
                className="w-full border-border text-foreground hover:bg-secondary">
                <ImageIcon className="w-4 h-4 mr-2" />
                Instagram / X 用画像を作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageCustomizerModal
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        setlist={setlist}
        displayUrl={displayUrl}
      />
    </>
  )
}
