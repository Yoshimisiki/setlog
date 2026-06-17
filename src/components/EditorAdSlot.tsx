'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID

export default function EditorAdSlot() {
  const initialized = useRef(false)

  useEffect(() => {
    if (!clientId || !slotId || initialized.current) return
    initialized.current = true
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch {}
  }, [])

  if (!clientId || !slotId) return null

  return (
    <div>
      <p className="text-[10px] text-muted-foreground/50 mb-1">広告</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
