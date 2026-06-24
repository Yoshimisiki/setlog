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

const CS = 1080

const SETLOG_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">' +
  '<rect width="32" height="32" rx="7" fill="#0a0a0a"/>' +
  '<g transform="translate(4,4)" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">' +
  '<path d="M16 5H3"/><path d="M11 12H3"/><path d="M11 19H3"/>' +
  '<path d="M21 16V5"/><circle cx="18" cy="16" r="3"/>' +
  '</g></svg>'
)}`

const FONTS = [
  { id: 'Geist',               label: 'Geist（モダン）',                 google: null },
  { id: 'Noto Sans JP',        label: 'Noto Sans JP（汎用）',            google: 'Noto+Sans+JP' },
  { id: 'Shippori Mincho',     label: 'Shippori Mincho（明朝体）',       google: 'Shippori+Mincho' },
  { id: 'M PLUS Rounded 1c',  label: 'M PLUS Rounded 1c（丸ゴシ）',     google: 'M+PLUS+Rounded+1c' },
  { id: 'Zen Kaku Gothic New', label: 'Zen Kaku Gothic New（ゴシック）', google: 'Zen+Kaku+Gothic+New' },
]

type Tab = 'bg' | 'text' | 'layout'

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return `rgba(${parseInt(f.slice(0,2),16)||0},${parseInt(f.slice(2,4),16)||0},${parseInt(f.slice(4,6),16)||0},${a})`
}

interface Props { open: boolean; onClose: () => void; setlist: Setlist; displayUrl: string }

export default function ImageCustomizerModal({ open, onClose, setlist, displayUrl }: Props) {
  const [tab, setTab] = useState<Tab>('bg')

  // 背景
  const [bgColor,   setBgColor]   = useState('#0a0a0a')
  const [bgImage,   setBgImage]   = useState<string | null>(null)
  const [bgImageW,  setBgImageW]  = useState(0)
  const [bgImageH,  setBgImageH]  = useState(0)
  const [bgScale,   setBgScale]   = useState(1.0)
  const [bgOffsetX, setBgOffsetX] = useState(0)
  const [bgOffsetY, setBgOffsetY] = useState(0)

  // テキスト
  const [textColor, setTextColor] = useState('#ffffff')
  const [font,      setFont]      = useState('Geist')
  const [showDuration, setShowDuration] = useState(true)

  // ロゴ
  const [logo,     setLogo]     = useState<string | null>(null)
  const [logoNW,   setLogoNW]   = useState(0)
  const [logoNH,   setLogoNH]   = useState(0)
  const [logoX,    setLogoX]    = useState(50)
  const [logoY,    setLogoY]    = useState(50)
  const [logoSize, setLogoSize] = useState(150)

  // QR / テキスト位置
  const [qrX,   setQrX]   = useState(870)
  const [qrY,   setQrY]   = useState(870)
  const [textX, setTextX] = useState(50)
  const [textY, setTextY] = useState(180)

  // レンダリング
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [rendering,  setRendering]  = useState(false)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 背景画像の自然サイズ取得
  useEffect(() => {
    if (!bgImage) { setBgImageW(0); setBgImageH(0); return }
    const img = new Image()
    img.onload = () => { setBgImageW(img.naturalWidth); setBgImageH(img.naturalHeight) }
    img.src = bgImage
  }, [bgImage])

  // ロゴの自然サイズ取得
  useEffect(() => {
    if (!logo) { setLogoNW(0); setLogoNH(0); return }
    const img = new Image()
    img.onload = () => { setLogoNW(img.naturalWidth); setLogoNH(img.naturalHeight) }
    img.src = logo
  }, [logo])

  // localStorage 読み込み
  useEffect(() => {
    if (!open) return
    try {
      const s = JSON.parse(localStorage.getItem('image:settings') ?? '{}')
      if (s.bgColor)           setBgColor(s.bgColor)
      if (s.textColor)         setTextColor(s.textColor)
      if (s.font)              setFont(s.font)
      if (s.showDuration != null) setShowDuration(s.showDuration)
      if (s.bgScale    != null) setBgScale(s.bgScale)
      if (s.bgOffsetX  != null) setBgOffsetX(s.bgOffsetX)
      if (s.bgOffsetY  != null) setBgOffsetY(s.bgOffsetY)

      const l = JSON.parse(localStorage.getItem('image:layout') ?? '{}')
      if (l.logoX    != null) setLogoX(l.logoX)
      if (l.logoY    != null) setLogoY(l.logoY)
      if (l.logoSize != null) setLogoSize(l.logoSize)
      if (l.qrX      != null) setQrX(l.qrX)
      if (l.qrY      != null) setQrY(l.qrY)
      if (l.textX    != null) setTextX(l.textX)
      if (l.textY    != null) setTextY(l.textY)

      const bg = localStorage.getItem('image:bg')
      if (bg) setBgImage(bg)
      const lg = localStorage.getItem('band:logo')
      if (lg) setLogo(lg)
    } catch {}
  }, [open])

  // Google Fonts
  useEffect(() => {
    if (!open) return
    FONTS.forEach(f => {
      if (!f.google || document.getElementById(`gf-${f.google}`)) return
      const el = Object.assign(document.createElement('link'), {
        id: `gf-${f.google}`, rel: 'stylesheet',
        href: `https://fonts.googleapis.com/css2?family=${f.google}:wght@400;700&display=swap`,
      })
      document.head.appendChild(el)
    })
  }, [open])

  // Canvas 描画
  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setRendering(true)
    canvas.width = CS; canvas.height = CS

    try { await document.fonts.load(`bold 48px "${font}"`) } catch {}

    // 背景色
    ctx.fillStyle = bgColor || '#0a0a0a'
    ctx.fillRect(0, 0, CS, CS)

    // 背景画像（contain + bgScale + bgOffset）
    if (bgImage && bgImageW && bgImageH) {
      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); img.src = bgImage })
      const imgAspect = bgImageW / bgImageH
      let drawW: number, drawH: number
      if (imgAspect > 1) {
        drawW = CS * bgScale
        drawH = drawW / imgAspect
      } else {
        drawH = CS * bgScale
        drawW = drawH * imgAspect
      }
      const offsetX = (CS - drawW) / 2 + bgOffsetX
      const offsetY = (CS - drawH) / 2 + bgOffsetY
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
    }

    const ff = `"${font}", sans-serif`
    const tc = textColor || '#ffffff'
    const tx = Math.round(textX)
    const ty = Math.round(textY)

    // バンド名
    ctx.fillStyle = tc
    ctx.font = `bold ${setlist.band_name.length > 16 ? 44 : 58}px ${ff}`
    ctx.fillText(setlist.band_name, tx, ty)

    // 日付・会場
    const dateStr = setlist.event_date
      ? format(new Date(setlist.event_date), 'yyyy年M月d日', { locale: ja }) : ''
    ctx.fillStyle = hexToRgba(tc, 0.6)
    ctx.font = `26px ${ff}`
    let iy = ty + 52
    if (dateStr)            { ctx.fillText(dateStr,            tx, iy); iy += 36 }
    if (setlist.venue_name) { ctx.fillText(setlist.venue_name, tx, iy) }

    // 区切り線
    ctx.strokeStyle = hexToRgba(tc, 0.15)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(tx, ty + 100); ctx.lineTo(Math.min(tx + 750, CS - 40), ty + 100)
    ctx.stroke()

    // セットリスト
    ctx.font = `24px ${ff}`
    const maxItems = Math.min(setlist.items.length, 20)
    for (let i = 0; i < maxItems; i++) {
      const item = setlist.items[i]
      const y    = ty + 140 + i * 40
      ctx.fillStyle = hexToRgba(tc, 0.35)
      ctx.fillText(`${i + 1}.`, tx, y)
      ctx.fillStyle = item.type === 'song' ? tc : hexToRgba(tc, 0.45)
      ctx.fillText(item.title.length > 28 ? item.title.slice(0, 26) + '…' : item.title, tx + 42, y)
      if (showDuration && item.duration_seconds > 0) {
        ctx.fillStyle = hexToRgba(tc, 0.3)
        ctx.textAlign = 'right'
        ctx.fillText(formatSeconds(item.duration_seconds), tx + 760, y)
        ctx.textAlign = 'left'
      }
    }
    if (setlist.items.length > 20) {
      ctx.fillStyle = hexToRgba(tc, 0.3)
      ctx.fillText(`+ ${setlist.items.length - 20} more`, tx + 42, ty + 140 + 20 * 40)
    }

    // ロゴ（縦横比保持: 幅=logoSize, 高さ=logoSize/aspect）
    if (logo && logoNW && logoNH) {
      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res(); img.src = logo })
      const logoAspect = logoNW / logoNH
      const logoDrawW  = logoSize
      const logoDrawH  = logoSize / logoAspect
      ctx.drawImage(img, Math.round(logoX), Math.round(logoY), Math.round(logoDrawW), Math.round(logoDrawH))
    }

    // QRコード
    try {
      const qrDataUrl = await QRCode.toDataURL(displayUrl, { width: 160, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      const qrImg = new Image()
      await new Promise<void>(res => { qrImg.onload = () => res(); qrImg.onerror = () => res(); qrImg.src = qrDataUrl })
      const qx = Math.round(qrX); const qy = Math.round(qrY)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(qx - 8, qy - 8, 176, 176)
      ctx.drawImage(qrImg, qx, qy, 160, 160)
    } catch {}

    // SETLOGアイコン
    try {
      const iconImg = new Image()
      await new Promise<void>(res => { iconImg.onload = () => res(); iconImg.onerror = () => res(); iconImg.src = SETLOG_ICON })
      const iconSize = 40
      const ix = tx; const iy2 = CS - iconSize - 14
      ctx.drawImage(iconImg, ix, iy2, iconSize, iconSize)
      ctx.fillStyle = hexToRgba(tc, 0.65)
      ctx.font = `bold 24px ${ff}`
      ctx.fillText('SETLOG', ix + iconSize + 8, iy2 + iconSize * 0.72)
    } catch {}

    ctx.fillStyle = hexToRgba(tc, 0.2)
    ctx.font = `11px ${ff}`
    ctx.fillText(displayUrl.length > 60 ? displayUrl.slice(0, 58) + '…' : displayUrl, tx, CS - 6)

    setPreviewSrc(canvas.toDataURL('image/jpeg', 0.8))
    setRendering(false)
  }, [bgColor, bgImage, bgImageW, bgImageH, bgScale, bgOffsetX, bgOffsetY,
      textColor, font, showDuration, textX, textY, logo, logoNW, logoNH, logoX, logoY, logoSize,
      qrX, qrY, setlist, displayUrl])

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => { draw() })
    return () => cancelAnimationFrame(raf)
  }, [open, draw])

  const readFile = (file: File, maxMB: number) => new Promise<string>((resolve, reject) => {
    if (file.size > maxMB * 1024 * 1024) return reject(new Error('too large'))
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })

  const saveAll = () => {
    localStorage.setItem('image:settings', JSON.stringify({ bgColor, textColor, font, bgScale, bgOffsetX, bgOffsetY, showDuration }))
    localStorage.setItem('image:layout',   JSON.stringify({ logoX, logoY, logoSize, qrX, qrY, textX, textY }))
    if (bgImage) localStorage.setItem('image:bg',  bgImage)
    else         localStorage.removeItem('image:bg')
    if (logo)    localStorage.setItem('band:logo', logo)
    else         localStorage.removeItem('band:logo')
  }

  const download = () => {
    saveAll()
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `setlog-${Date.now()}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  // canvas座標 → display座標の倍率
  const sc = () => (containerRef.current?.offsetWidth ?? CS) / CS

  const sliderCls = 'w-full h-1.5 rounded appearance-none cursor-pointer bg-secondary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary'

  const SmallPreview = previewSrc && tab !== 'layout' ? (
    <div className="rounded-lg overflow-hidden border border-border mt-2">
      <img src={previewSrc} alt="preview" className="w-full aspect-square object-cover" />
    </div>
  ) : null

  // ロゴの描画サイズ（canvas座標系）
  const logoAspect = logoNW > 0 && logoNH > 0 ? logoNW / logoNH : 1
  const logoDrawW  = logoSize
  const logoDrawH  = logoSize / logoAspect

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">画像カスタマイズ</DialogTitle>
          <DialogDescription className="sr-only">Instagram / X 用画像を作成</DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-border">
          {(['bg','text','layout'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 py-2 text-sm transition-colors',
                tab === t ? 'text-foreground border-b-2 border-primary -mb-px font-medium' : 'text-muted-foreground hover:text-foreground'
              )}>
              {t === 'bg' ? '背景' : t === 'text' ? 'テキスト' : 'ロゴ・QR配置'}
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-1">

          {/* 背景タブ */}
          {tab === 'bg' && (<>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">背景色</Label>
              <div className="flex gap-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5" />
                <Input value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="bg-input border-border text-foreground font-mono h-10 uppercase" placeholder="#0a0a0a" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">背景画像（PNG/JPG・最大5MB）</Label>
              {bgImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-secondary">
                    <img src={bgImage} alt="bg" className="w-full h-28 object-contain" />
                    <button onClick={() => setBgImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">スケール: {bgScale.toFixed(2)}×</span>
                      <button onClick={() => { setBgScale(1); setBgOffsetX(0); setBgOffsetY(0) }}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5">リセット</button>
                    </div>
                    <input type="range" min={10} max={300} step={5} value={Math.round(bgScale * 100)}
                      onChange={e => setBgScale(Number(e.target.value) / 100)} className={sliderCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">X: {Math.round(bgOffsetX)}</span>
                      <input type="range" min={-540} max={540} value={bgOffsetX}
                        onChange={e => setBgOffsetX(Number(e.target.value))} className={sliderCls} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Y: {Math.round(bgOffsetY)}</span>
                      <input type="range" min={-540} max={540} value={bgOffsetY}
                        onChange={e => setBgOffsetY(Number(e.target.value))} className={sliderCls} />
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg h-20 cursor-pointer hover:border-primary text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />アップロード
                  <input type="file" accept="image/png,image/jpeg" className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0]; if (!f) return
                      try { setBgImage(await readFile(f, 5)); setBgScale(1); setBgOffsetX(0); setBgOffsetY(0) } catch {}
                    }} />
                </label>
              )}
            </div>
            {SmallPreview}
          </>)}

          {/* テキストタブ */}
          {tab === 'text' && (<>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">テキスト色</Label>
              <div className="flex gap-2">
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5" />
                <Input value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="bg-input border-border text-foreground font-mono h-10 uppercase" placeholder="#ffffff" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">フォント</Label>
              <div className="space-y-1.5">
                {FONTS.map(f => (
                  <button key={f.id} onClick={() => setFont(f.id)}
                    className={cn('w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                      font === f.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                    )} style={{ fontFamily: `"${f.id}", sans-serif` }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">曲の時間を表示</Label>
              <button
                onClick={() => setShowDuration(d => !d)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
                  showDuration ? 'bg-green-600 border-green-500' : 'bg-secondary border-border'
                )}
              >
                <span className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  showDuration ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>
            {SmallPreview}
          </>)}

          {/* ロゴ・QR配置タブ */}
          {tab === 'layout' && (<>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">ロゴ画像（PNG推奨・最大3MB）</Label>
              {logo ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <img src={logo} alt="logo" className="h-12 w-12 object-contain rounded border border-border bg-secondary" />
                    <label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1">
                      変更
                      <input type="file" accept="image/png,image/jpeg" className="hidden"
                        onChange={async e => {
                          const f = e.target.files?.[0]; if (!f) return
                          try { const d = await readFile(f, 3); setLogo(d); localStorage.setItem('band:logo', d) } catch {}
                        }} />
                    </label>
                    <button onClick={() => { setLogo(null); localStorage.removeItem('band:logo') }}
                      className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 flex items-center gap-1">
                      <X className="w-3 h-3" />削除
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">サイズ（幅）: {Math.round(logoSize)}px</span>
                      <button onClick={() => setLogoSize(150)}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5">リセット</button>
                    </div>
                    <input type="range" min={20} max={700} value={Math.round(logoSize)}
                      onChange={e => setLogoSize(Number(e.target.value))} className={sliderCls} />
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg h-16 cursor-pointer hover:border-primary text-sm text-muted-foreground">
                  <Upload className="w-4 h-4" />ロゴをアップロード
                  <input type="file" accept="image/png,image/jpeg" className="hidden"
                    onChange={async e => {
                      const f = e.target.files?.[0]; if (!f) return
                      try { const d = await readFile(f, 3); setLogo(d); localStorage.setItem('band:logo', d) } catch {}
                    }} />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                ドラッグして配置・右下◎でロゴリサイズ
              </Label>
              {/* overflow-hidden を外してリサイズハンドルがクリップされないようにする */}
              <div ref={containerRef}
                className="relative w-full aspect-square rounded-lg bg-black select-none border border-border">

                {previewSrc && (
                  <img src={previewSrc} alt="preview" draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-lg" />
                )}
                {rendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* ロゴ overlay: 移動ハンドル + 子要素としてリサイズハンドル */}
                {logo && logoNW > 0 && (() => {
                  const s = sc()
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left:   logoX     * s,
                        top:    logoY     * s,
                        width:  logoDrawW * s,
                        height: logoDrawH * s,
                        border: '1px dashed rgba(255,255,255,0.7)',
                        cursor: 'move',
                        touchAction: 'none',
                      }}
                      onPointerDown={e => {
                        e.preventDefault()
                        const target = e.currentTarget
                        target.setPointerCapture(e.pointerId)
                        const startPX = e.clientX; const startPY = e.clientY
                        const startLX = logoX;      const startLY = logoY
                        const cs = sc()
                        const onMove = (ev: PointerEvent) => {
                          ev.preventDefault()
                          setLogoX(Math.max(0, startLX + (ev.clientX - startPX) / cs))
                          setLogoY(Math.max(0, startLY + (ev.clientY - startPY) / cs))
                        }
                        const onUp = (ev: PointerEvent) => {
                          try { target.releasePointerCapture(ev.pointerId) } catch {}
                          target.removeEventListener('pointermove', onMove)
                          target.removeEventListener('pointerup', onUp)
                          target.removeEventListener('pointercancel', onUp)
                          saveAll()
                        }
                        target.addEventListener('pointermove', onMove)
                        target.addEventListener('pointerup', onUp)
                        target.addEventListener('pointercancel', onUp)
                      }}
                    >
                      <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 4px', borderRadius: 2, pointerEvents: 'none' }}>ロゴ</span>

                      {/* リサイズハンドル（子要素として右下に配置・setPointerCapture方式） */}
                      <div
                        style={{
                          position: 'absolute',
                          right: -10, bottom: -10,
                          width: 22, height: 22,
                          background: 'white', border: '2px solid #000', borderRadius: '50%',
                          cursor: 'nwse-resize', touchAction: 'none', zIndex: 30,
                        }}
                        onPointerDown={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          const target = e.currentTarget
                          target.setPointerCapture(e.pointerId)
                          const startX = e.clientX; const startY = e.clientY
                          const startSize = logoSize
                          const cs = sc()
                          const onMove = (ev: PointerEvent) => {
                            ev.preventDefault()
                            const dx = ev.clientX - startX
                            const dy = ev.clientY - startY
                            const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy
                            setLogoSize(Math.max(20, Math.min(800, startSize + delta / cs)))
                          }
                          const onUp = (ev: PointerEvent) => {
                            try { target.releasePointerCapture(ev.pointerId) } catch {}
                            target.removeEventListener('pointermove', onMove)
                            target.removeEventListener('pointerup', onUp)
                            target.removeEventListener('pointercancel', onUp)
                            saveAll()
                          }
                          target.addEventListener('pointermove', onMove)
                          target.addEventListener('pointerup', onUp)
                          target.addEventListener('pointercancel', onUp)
                        }}
                      />
                    </div>
                  )
                })()}

                {/* QR移動ハンドル */}
                {(() => {
                  const s = sc(); const qSize = 160
                  return (
                    <div
                      style={{ position: 'absolute', left: qrX * s, top: qrY * s, width: qSize * s, height: qSize * s, border: '1px dashed rgba(255,255,255,0.5)', cursor: 'move', touchAction: 'none' }}
                      onPointerDown={e => {
                        e.preventDefault()
                        const target = e.currentTarget
                        target.setPointerCapture(e.pointerId)
                        const startPX = e.clientX; const startPY = e.clientY
                        const startQX = qrX;       const startQY = qrY
                        const cs = sc()
                        const onMove = (ev: PointerEvent) => {
                          ev.preventDefault()
                          setQrX(Math.max(0, Math.min(CS - qSize, startQX + (ev.clientX - startPX) / cs)))
                          setQrY(Math.max(0, Math.min(CS - qSize, startQY + (ev.clientY - startPY) / cs)))
                        }
                        const onUp = (ev: PointerEvent) => {
                          try { target.releasePointerCapture(ev.pointerId) } catch {}
                          target.removeEventListener('pointermove', onMove)
                          target.removeEventListener('pointerup', onUp)
                          target.removeEventListener('pointercancel', onUp)
                          saveAll()
                        }
                        target.addEventListener('pointermove', onMove)
                        target.addEventListener('pointerup', onUp)
                        target.addEventListener('pointercancel', onUp)
                      }}
                    >
                      <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 4px', borderRadius: 2, pointerEvents: 'none' }}>QR</span>
                    </div>
                  )
                })()}

                {/* テキストブロック移動ハンドル */}
                {(() => {
                  const s = sc()
                  return (
                    <div
                      style={{ position: 'absolute', left: textX * s, top: (textY - 20) * s, border: '1px dashed rgba(255,255,255,0.5)', cursor: 'move', touchAction: 'none', padding: '2px 6px' }}
                      onPointerDown={e => {
                        e.preventDefault()
                        const target = e.currentTarget
                        target.setPointerCapture(e.pointerId)
                        const startPX = e.clientX; const startPY = e.clientY
                        const startTX = textX;     const startTY = textY
                        const cs = sc()
                        const onMove = (ev: PointerEvent) => {
                          ev.preventDefault()
                          setTextX(Math.max(0, startTX + (ev.clientX - startPX) / cs))
                          setTextY(Math.max(20, startTY + (ev.clientY - startPY) / cs))
                        }
                        const onUp = (ev: PointerEvent) => {
                          try { target.releasePointerCapture(ev.pointerId) } catch {}
                          target.removeEventListener('pointermove', onMove)
                          target.removeEventListener('pointerup', onUp)
                          target.removeEventListener('pointercancel', onUp)
                          saveAll()
                        }
                        target.addEventListener('pointermove', onMove)
                        target.addEventListener('pointerup', onUp)
                        target.addEventListener('pointercancel', onUp)
                      }}
                    >
                      <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 4px', borderRadius: 2, pointerEvents: 'none' }}>テキスト</span>
                    </div>
                  )
                })()}
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
