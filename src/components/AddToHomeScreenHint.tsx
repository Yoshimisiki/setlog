'use client'

import { useEffect, useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const DISMISSED_KEY = 'setlog:add-to-home-screen-hint-dismissed'

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPhone|iPad|iPod/.test(ua)
  if (!isIos) return false
  // iOS Chrome / Firefox / Edge / Opera は除外
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false
  return true
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((navigator as any).standalone === true) return true
  return false
}

export default function AddToHomeScreenHint() {
  const t = useTranslations('editor')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIosSafari()) return
    if (isStandalone()) return
    if (localStorage.getItem(DISMISSED_KEY) === '1') return
    setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm">
      <Smartphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <p className="flex-1 text-foreground/80 leading-snug text-xs">
        {t('addToHomeScreenHint')}
      </p>
      <button
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label={t('close')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
