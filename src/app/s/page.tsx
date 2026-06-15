'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListMusic } from 'lucide-react'
import { decodeSetlist } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { Setlist } from '@/types'
import SetlistView from '@/components/SetlistView'

export default function PublicPage() {
  const t = useTranslations('public')
  const tc = useTranslations('common')
  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) { setError(true); return }
    const decoded = decodeSetlist<Setlist>(hash)
    if (!decoded) { setError(true); return }
    setSetlist(decoded)
  }, [])

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

  return <SetlistView setlist={setlist} />
}
