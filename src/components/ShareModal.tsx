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
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [shortening, setShortening] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const encoded = encodeSetlist(setlist)
  const longUrl = `${appUrl}/s#${encoded}`

  const displayUrl = shortUrl ?? longUrl
  const totalSeconds = setlist.items.reduce((s, i) => s + i.duration_seconds, 0)
  const songCount = setlist.items.filter((i) => i.type === 'song').length

  // Shorten URL when modal opens
  useEffect(() => {
    if (!open) { setShortUrl(null); return }
    setShortening(true)
    fetch(`/api/shorten?url=${encodeURIComponent(longUrl)}`)
      .then((r) => r.json())
      .then((d) => { if (d.short) setShortUrl(d.short) })
      .catch(() => {})
      .finally(() => setShortening(false))
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

    const songs = setlist.items.filter((i) => i.type === 'song').map((i) => i.title)

    const text = [
      `🎵Setlist from ${setlist.band_name}`,
      dateStr,
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
      ctx.fillText(formatSeconds(item.duration_seconds), W - 50, y)
      ctx.textAlign = 'left'
    }
    if (setlist.items.length > 18) {
      ctx.fillStyle = '#444'
      ctx.fillText(`+ ${setlist.items.length - 18} more`, 90, 300 + 18 * 40)
    }

    // QR code (bottom-right corner)
    try {
      const qrDataUrl = await QRCode.toDataURL(displayUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      const qrImg = new Image()
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve()
        qrImg.src = qrDataUrl
      })
      const qrSize = 150
      const qrPad = 40
      const qrX = W - qrPad - qrSize
      const qrY = H - qrPad - qrSize
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16)
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    } catch {}

    // Footer
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, H - 80, W, 80)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('SETLOG', 50, H - 45)
    ctx.fillStyle = '#666'
    ctx.font = '14px sans-serif'
    const footerUrl = displayUrl.length > 50 ? displayUrl.slice(0, 48) + '…' : displayUrl
    ctx.fillText(footerUrl, 50, H - 20)
    ctx.fillStyle = '#888'
    ctx.textAlign = 'right'
    ctx.fillText(formatSeconds(totalSeconds), W - 220, H - 35)
    ctx.textAlign = 'left'

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
            {shortening ? (
              <div className="flex items-center gap-2 flex-1">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">短縮中...</span>
              </div>
            ) : (
              <code className="flex-1 text-xs text-foreground break-all line-clamp-2">{displayUrl}</code>
            )}
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={shortening}
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Share buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleTwitter}
              className="w-full bg-[#1d9bf0] text-white hover:bg-[#1d9bf0]/90"
              disabled={shortening}
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
