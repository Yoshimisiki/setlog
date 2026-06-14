'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { loadCurrentSetlist, saveCurrentSetlist } from '@/lib/storage'
import { decodeSetlist } from '@/lib/utils'
import { toast } from 'sonner'
import SetlistEditor from '@/components/SetlistEditor'
import type { Setlist } from '@/types'

function EditorInner() {
  const [ready, setReady] = useState(false)
  const [initial, setInitial] = useState<Setlist | undefined>(undefined)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const init = async () => {
      // URLハッシュからセトリロード（「ベースに編集」機能）
      const hash = window.location.hash.slice(1)
      if (hash) {
        const decoded = decodeSetlist<Setlist>(hash)
        if (decoded) {
          saveCurrentSetlist(decoded)
          setInitial(decoded)
          window.history.replaceState({}, '', '/editor')
          toast.success('セトリを読み込みました')
        } else {
          setInitial(loadCurrentSetlist())
        }
      } else {
        setInitial(loadCurrentSetlist())
      }

      setReady(true)
    }
    init()
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">読み込み中...</div>
      </div>
    )
  }

  return <SetlistEditor initialSetlist={initial} />
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground text-sm">読み込み中...</div>
        </div>
      }
    >
      <EditorInner />
    </Suspense>
  )
}
