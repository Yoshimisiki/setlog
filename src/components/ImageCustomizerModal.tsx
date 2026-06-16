'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Upload, X } from 'lucide-react'
import { cn, formatSeconds } from '@/lib/utils'
import QRCode from 'qrcode'
import type { Setlist } from '@/types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const CS = 1080 // canvas size

const FONTS = [
  { id: 'Geist',               label: 'Geist（モダン）',            google: null },
  { id: 'Noto Sans JP',        label: 'Noto Sans JP（汎用）',       google: 'Noto+Sans+JP' },
  { id: 'Shippori Mincho',     label: 'Shippori Mincho（明朝体）',  google: 'Shippori+Mincho' },
  { id: 'M PLUS Rounded 1c',  label: 'M PLUS Rounded 1c（丸ゴシ）',google: 'M+PLUS+Rounded+1c' },
  { id: 'Zen Kaku Gothic New', label: 'Zen Kaku Gothic New（ゴシック）', google: 'Zen+Kaku+Gothic+New' },
]

const LS_LOGO     = 'band:logo'
const LS_LAYOUT   = 'image:layout'
const LS_SETTINGS = 'image:settings'

interface LayoutPos { x: number; y: number }
interface Layout { logo: LayoutPos; qr: LayoutPos; text: LayoutPos }

const DEFAULT_LAYOUT: Layout = {
  logo: { x: 50,  y: 50  },
  qr:   { x: 870, y: 880 },
  text: { x: 50,  y: 200 },
}

type DragEl = 'logo' | 'qr' | 'text'
type Tab    = 'bg' | 'text' | 'layout'

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

interface Props {
  open: boolean
  onClose: () => void
  setlist: Setlist
  displayUrl: string
}

export default function ImageCustomizerModal({ open, onClose, setlist, displayUrl }: Props) {
  const [tab, setTab]               = useState<Tab>('bg')
  const [bgColor, setBgColor]       = useState('#0a0a0a')
  const [bgImage, setBgImage]       = useState<string | null>(null)
  const [textColor, setTextColor]   = useState('#ffffff')
  const [font, setFont]             = useState('Geist')
  const [logo, setLogo]             = useState<string | null>(null)
  const [layout, setLayout]         = useState<Layout>(DEFAULT_LAYOUT)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [rendering, setRendering]   = useState(false)
  const [dragging, setDragging]     = useState<DragEl | null>(null)
  const [dragOff, setDragOff]       = useState({ x: 0, y: 0 })

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Load from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    try {
      const s = JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '{}')
      if (s.bgColor)   setBgColor(s.bgColor)
      if (s.bgImage !== undefined) setBgImage(s.bgImage)
      if (s.textColor) setTextColor(s.textColor)
      if (s.font)      setFont(s.font)
      const l = JSON.parse(localStorage.getItem(LS_LAYOUT) ?? '{}')
      if (l.logo && l.qr && l.text) setLayout(l)
      const lg = localStorage.getItem(LS_LOGO)
      if (lg) setLogo(lg)
    } catch {}
  }, [open])

  // ── Load all Google Fonts on open ───────────────────────────────────────
  useEffect(() => {
    if (!open) return
    FONTS.forEach(f => {
      if (!f.google) return
      const id = `gf-${f.google}`
      if (document.getElementById(id)) return
      const el = document.createElement('link')
      el.id = id; el.rel = 'stylesheet'
      el.href = `https://fonts.googleapis.com/css2?family=${f.google}:wght@400;700&display=swap`
      document.head.appendChild(el)
    })
  }, [open])

  // ── Draw canvas ─────────────────────────────────────────────────────────
  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setRendering(true)
    canvas.width = CS; canvas.height = CS

    // Wait for selected font
    try { await document.fonts.load(`bold 48px "${font}"`) } catch {}

    // Background
    if (bgImage) {
      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); img.src = bgImage })
      ctx.drawImage(img, 0, 0, CS, CS)
    } else {
      ctx.fillStyle = bgColor || '#0a0a0a'
      ctx.fillRect(0, 0, CS, CS)
    }

    const ff = `"${font}", sans-serif`
    const tc = textColor || '#ffffff'

    // ── Text block ──────────────────────────────────────────────────────
    const tx = Math.round(layout.text.x)
    const ty = Math.round(layout.text.y)

    ctx.fillStyle = hexToRgba(tc, 0.5)
    ctx.font = `bold 30px ${ff}`
    ctx.fillText('SETLOG', tx, ty)

    ctx.fillStyle = tc
    ctx.font = `bold ${setlist.band_name.length > 16 ? 44 : 58}px ${ff}`
    ctx.fillText(setlist.band_name, tx, ty + 68)

    const dateStr = setlist.event_date
      ? format(new Date(setlist.event_date), 'yyyy年M月d日', { locale: ja }) : ''
    ctx.fillStyle = hexToRgba(tc, 0.6)
    ctx.font = `26px ${ff}`
    let iy = ty + 120
    if (dateStr)          { ctx.fillText(dateStr,          tx, iy); iy += 36 }
    if (setlist.venue_name) ctx.fillText(setlist.venue_name, tx, iy)

    ctx.strokeStyle = hexToRgba(tc, 0.15)
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(tx, ty + 170); ctx.lineTo(Math.min(tx + 750, CS - 40), ty + 170); ctx.stroke()

    const maxItems = Math.min(setlist.items.length, 18)
    ctx.font = `24px ${ff}`
    for (let i = 0; i < maxItems; i++) {
      const item = setlist.items[i]
      const y = ty + 210 + i * 40
      ctx.fillStyle = hexToRgba(tc, 0.35)
      ctx.fillText(`${i + 1}.`, tx, y)
      ctx.fillStyle = item.type === 'song' ? tc : hexToRgba(tc, 0.45)
      const title = item.title.length > 28 ? item.title.slice(0, 26) + '…' : item.title
      ctx.fillText(title, tx + 42, y)
      if (item.duration_seconds > 0) {
        ctx.fillStyle = hexToRgba(tc, 0.3)
        ctx.textAlign = 'right'
        ctx.fillText(formatSeconds(item.duration_seconds), tx + 760, y)
        ctx.textAlign = 'left'
      }
    }
    if (setlist.items.length > 18) {
      ctx.fillStyle = hexToRgba(tc, 0.3)
      ctx.fillText(`+ ${setlist.items.length - 18} more`, tx + 42, ty + 210 + 18 * 40)
    }

    // ── Logo ────────────────────────────────────────────────────────────
    if (logo) {
      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); img.src = logo })
      ctx.drawImage(img, Math.round(layout.logo.x), Math.round(layout.logo.y), 120, 120)
    }

    // ── QR code ─────────────────────────────────────────────────────────
    try {
      const qrDataUrl = await QRCode.toDataURL(displayUrl, {
        width: 160, margin: 1, color: { dark: '#000000', light: '#ffffff' },
      })
      const qrImg = new Image()
      await new Promise<void>(res => { qrImg.onload = () => res(); qrImg.src = qrDataUrl })
      const qx = Math.round(layout.qr.x)
      const qy = Math.round(layout.qr.y)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(qx - 8, qy - 8, 176, 176)
      ctx.drawImage(qrImg, qx, qy, 160, 160)
    } catch {}

    // ── Footer URL ──────────────────────────────────────────────────────
    ctx.fillStyle = hexToRgba(tc, 0.25)
    ctx.font = `13px ${ff}`
    const fu = displayUrl.length > 50 ? displayUrl.slice(0, 48) + '…' : displayUrl
    ctx.fillText(fu, tx, CS - 28)
    ctx.fillText('© 2026– SETLOG by Yowofuru LLC', tx, CS - 12)

    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.8))
    setRendering(false)
  }, [bgColor, bgImage, textColor, font, layout, logo, setlist, displayUrl])

  useEffect(() => {
    if (open) draw()
  }, [open, draw])

  // ── Drag ────────────────────────────────────────────────────────────────
  const scale = () => (containerRef.current?.offsetWidth ?? CS) / CS

  const onDragStart = (e: React.MouseEvent | React.TouchEvent, el: DragEl) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const sc = scale()
    const cx = ('touches' in e ? e.touches[0].clientX : e.clientX)
    const cy = ('touches' in e ? e.touches[0].clientY : e.clientY)
    setDragging(el)
    setDragOff({ x: (cx - rect.left) / sc - layout[el].x, y: (cy - rect.top) / sc - layout[el].y })
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent | TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const sc = scale()
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY
      const x = Math.max(0, Math.min(CS, (cx - rect.left) / sc - dragOff.x))
      const y = Math.max(0, Math.min(CS, (cy - rect.top)  / sc - dragOff.y))
      setLayout(prev => ({ ...prev, [dragging]: { x, y } }))
    }
    const up = () => {
      setDragging(null)
      setLayout(prev => { localStorage.setItem(LS_LAYOUT, JSON.stringify(prev)); return prev })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [dragging, dragOff])

  // ── File uploads ────────────────────────────────────────────────────────
  const readFile = (file: File, maxMB: number, cb: (d: string) => void) => {
    if (file.size > maxMB * 1024 * 1024) return
    const r = new FileReader()
    r.onload = () => cb(r.result as string)
    r.readAsDataURL(file)
  }

  const save = () => {
    localStorage.setItem(LS_SETTINGS, JSON.stringify({ bgColor, bgImage, textColor, font }))
    localStorage.setItem(LS_LAYOUT, JSON.stringify(layout))
  }

  const download = () => {
    save()
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `setlog-${Date.now()}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  // ── Preview (non-layout tabs) ────────────────────────────────────────────
  const SmallPreview = previewSrc ? (
    <div className="rounded-lg overflow-hidden border border-border mt-2">
      <img src={previewSrc} alt="preview" className="w-full aspect-square object-cover" />
    </div>
  ) : null

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">画像カスタマイズ</DialogTitle>
          <DialogDescription className="sr-only">Instagram / X 用画像を作成</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border -mx-1">
          {(['bg','text','layout'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-sm transition-colors',
                tab === t
                  ? 'text-foreground border-b-2 border-primary -mb-px font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'bg' ? '背景' : t === 'text' ? 'テキスト' : 'ロゴ・QR配置'}
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-1">

          {/* ── 背景タブ ─────────────────────────────────────────────── */}
          {tab === 'bg' && (<>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">背景色</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor}
                  onChange={e => { setBgImage(null); setBgColor(e.target.value) }}
                  className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5"
                />
                <Input value={bgColor}
                  onChange={e => { setBgImage(null); setBgColor(e.target.value) }}
                  className="bg-input border-border text-foreground font-mono h-10 uppercase"
                  placeholder="#0a0a0a"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">背景画像（PNG/JPG・最大3MB）</Label>
              {bgImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={bgImage} alt="bg" className="w-full h-32 object-cover" />
                  <button onClick={() => setBgImage(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg h-20 cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />アップロード
                  <input type="file" accept="image/png,image/jpeg"
                    onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, 3, setBgImage) }}
                    className="hidden" />
                </label>
              )}
            </div>
            {SmallPreview}
          </>)}

          {/* ── テキストタブ ──────────────────────────────────────────── */}
          {tab === 'text' && (<>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">テキスト色</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5"
                />
                <Input value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="bg-input border-border text-foreground font-mono h-10 uppercase"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">フォント</Label>
              <div className="space-y-1.5">
                {FONTS.map(f => (
                  <button key={f.id} onClick={() => setFont(f.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                      font === f.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                    style={{ fontFamily: `"${f.id}", sans-serif` }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {SmallPreview}
          </>)}

          {/* ── ロゴ・QR配置タブ ─────────────────────────────────────── */}
          {tab === 'layout' && (<>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">ロゴ画像（PNG推奨・最大2MB）</Label>
              {logo ? (
                <div className="flex items-center gap-2">
                  <img src={logo} alt="logo" className="h-12 w-12 object-contain rounded border border-border bg-secondary" />
                  <label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors">
                    変更
                    <input type="file" accept="image/png,image/jpeg"
                      onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, 2, d => { setLogo(d); localStorage.setItem(LS_LOGO, d) }) }}
                      className="hidden" />
                  </label>
                  <button onClick={() => { setLogo(null); localStorage.removeItem(LS_LOGO) }}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3" />削除
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg h-16 cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />ロゴをアップロード
                  <input type="file" accept="image/png,image/jpeg"
                    onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, 2, d => { setLogo(d); localStorage.setItem(LS_LOGO, d) }) }}
                    className="hidden" />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                ドラッグして配置を調整
                <span className="ml-1 text-muted-foreground/50">（ロゴ・QR・テキスト）</span>
              </Label>
              <div ref={containerRef}
                className="relative w-full aspect-square rounded-lg overflow-hidden bg-black select-none">
                {previewSrc && (
                  <img src={previewSrc} alt="preview" className="w-full h-full object-cover" draggable={false} />
                )}
                {rendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {/* Draggable handles */}
                {(['logo','qr','text'] as DragEl[]).map(el => {
                  const sc = containerRef.current ? containerRef.current.offsetWidth / CS : 1
                  const pos = layout[el]
                  const label = el === 'logo' ? 'ロゴ' : el === 'qr' ? 'QR' : 'テキスト'
                  return (
                    <div key={el}
                      style={{ position: 'absolute', left: pos.x * sc, top: pos.y * sc, touchAction: 'none' }}
                      onMouseDown={e => onDragStart(e, el)}
                      onTouchStart={e => onDragStart(e, el)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <div className={cn(
                        'border-2 rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap backdrop-blur-sm',
                        dragging === el
                          ? 'border-yellow-400 bg-yellow-400/30 text-yellow-300'
                          : 'border-white/60 bg-black/50 text-white/80'
                      )}>
                        {label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>)}
        </div>

        <Button onClick={download} disabled={rendering}
          className="w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-11">
          <Download className="w-4 h-4 mr-2" />
          画像をダウンロード（PNG）
        </Button>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
