'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID

export default function AdBanner() {
  const t = useTranslations('public')
  const initialized = useRef(false)

  useEffect(() => {
    if (!clientId || !slotId || initialized.current) return
    initialized.current = true
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {}
  }, [])

  if (!clientId || !slotId) {
    return (
      <div className="w-full h-[90px] bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground text-xs">
        {t('adSpace')}
      </div>
    )
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
