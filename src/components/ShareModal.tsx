'use client'

import { useRef, useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Twitter, Download, Check, Loader2 } from 'lucide-react'
import { encodeSetlist, formatSeconds } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import QRCode from 'qrcode'
import type { Setlist } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Props {
  open: boolean
  onClose: () => void
  setlist: Setlist
}

export default function ShareModal({ open, onClose, setlist }: Props) {
  const t = useTranslations('share')
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const fallbackUrl = `${appUrl}/s#${encodeSetlist(setlist)}`
  const displayUrl = shareUrl ?? fallbackUrl
  const totalSeconds = setlist.items.reduce((s, i) => s + i.duration_seconds, 0)

  // Save to Supabase when modal opens
  useEffect(() => {
    if (!open) { setShareUrl(null); return }
    setSaving(true)
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: setlist }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.id) setShareUrl(`${appUrl}/s/${d.id}`) })
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

    const songs = setlist.items.filter((i) => i.type === 'song').map((i) => i.title)

    const text = [
      `🎵Setlist from ${setlist.band_name}`,
      dateVenueStr,
      t('twitterStreamingLine'),
      ...songs,
      '#SETLOG #setlist',
    ].filter(Boolean).join('\n')

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(displayUrl)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
  }

  const handleInstagram = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1080, H = 1080
    canvas.width = W
    canvas.height = H

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#0a0a0a')
    grad.addColorStop(1, '#111111')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Accent bar (white)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 6, H)

    // App name
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 34px sans-serif'
    ctx.fillText('SETLOG', 50, 65)

    // Band name
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${setlist.band_name.length > 16 ? '44' : '56'}px sans-serif`
    ctx.fillText(setlist.band_name, 50, 140)

    // Date / Venue
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '26px sans-serif'
    const dateStr = setlist.event_date
      ? format(new Date(setlist.event_date), 'yyyy年M月d日', { locale: ja })
      : ''
    if (dateStr) ctx.fillText(dateStr, 50, 190)
    if (setlist.venue_name) ctx.fillText(setlist.venue_name, 50, dateStr ? 225 : 190)

    // Divider
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 260)
    ctx.lineTo(W - 50, 260)
    ctx.stroke()

    // Items
    const maxItems = Math.min(setlist.items.length, 18)
    ctx.font = '24px sans-serif'
    for (let i = 0; i < maxItems; i++) {
      const item = setlist.items[i]
      const y = 300 + i * 40
      ctx.fillStyle = '#666'
      ctx.fillText(`${i + 1}.`, 50, y)
      ctx.fillStyle = item.type === 'song' ? '#fff' : '#888'
      const title = item.title.length > 28 ? item.title.slice(0, 26) + '…' : item.title
      ctx.fillText(title, 90, y)
      ctx.fillStyle = '#444'
      ctx.textAlign = 'right'
      if (item.duration_seconds > 0) ctx.fillText(formatSeconds(item.duration_seconds), W - 50, y)
      ctx.textAlign = 'left'
    }
    if (setlist.items.length > 18) {
      ctx.fillStyle = '#444'
      ctx.fillText(`+ ${setlist.items.length - 18} more`, 90, 300 + 18 * 40)
    }

    // Pre-generate QR (uses displayUrl — short if saved, fallback if not)
    let qrImg: HTMLImageElement | null = null
    try {
      const qrDataUrl = await QRCode.toDataURL(displayUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
      qrImg = new Image()
      await new Promise<void>((resolve) => {
        qrImg!.onload = () => resolve()
        qrImg!.src = qrDataUrl
      })
    } catch {}

    // Footer
    const footerY = H - 100
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, footerY, W, 100)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('SETLOG', 50, H - 60)
    ctx.fillStyle = '#888'
    ctx.textAlign = 'right'
    ctx.fillText(formatSeconds(totalSeconds), W - 220, H - 60)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#555'
    ctx.font = '13px sans-serif'
    const footerUrl = displayUrl.length > 50 ? displayUrl.slice(0, 48) + '…' : displayUrl
    ctx.fillText(footerUrl, 50, H - 35)
    ctx.fillStyle = '#444'
    ctx.fillText('© 2026– SETLOG by Yowofuru LLC / Yoshimisiki', 50, H - 15)

    // QR code — drawn last so it sits on top of footer
    if (qrImg) {
      const qrSize = 76
      const qrX = W - 20 - qrSize
      const qrY = footerY + (100 - qrSize) / 2
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8)
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    }

    const link = document.createElement('a')
    link.download = `setlog-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success(t('downloadSuccess'))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL display */}
          <div className="bg-secondary rounded-lg p-3 flex items-center gap-2 min-h-[52px]">
            {saving ? (
              <div className="flex items-center gap-2 flex-1">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">URLを生成中...</span>
              </div>
            ) : (
              <code className="flex-1 text-xs text-foreground break-all line-clamp-2">{displayUrl}</code>
            )}
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={saving}
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Share buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleTwitter}
              className="w-full bg-[#1d9bf0] text-white hover:bg-[#1d9bf0]/90"
              disabled={saving}
            >
              <Twitter className="w-4 h-4 mr-2" />
              {t('twitterShare')}
            </Button>
            <Button
              variant="outline"
              onClick={handleInstagram}
              className="w-full border-border text-foreground hover:bg-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('instagramDownload')}
            </Button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
