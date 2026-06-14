import type { Setlist } from '@/types'
import { nanoid } from 'nanoid'

const KEY_CURRENT = 'setlist:current'
const KEY_HISTORY = 'setlist:history'
const MAX_HISTORY = 10

export function defaultSetlist(): Setlist {
  return {
    title: '',
    band_name: '',
    venue_name: '',
    venue_url: '',
    event_date: '',
    target_seconds: 45 * 60,
    items: [],
    created_at: new Date().toISOString(),
  }
}

export function loadCurrentSetlist(): Setlist {
  try {
    const raw = localStorage.getItem(KEY_CURRENT)
    if (raw) return JSON.parse(raw) as Setlist
  } catch {}
  return defaultSetlist()
}

export function saveCurrentSetlist(setlist: Setlist): void {
  localStorage.setItem(KEY_CURRENT, JSON.stringify(setlist))
}

export function saveToHistory(setlist: Setlist): string {
  const id = nanoid(8)
  localStorage.setItem(`setlist:${id}`, JSON.stringify(setlist))

  const raw = localStorage.getItem(KEY_HISTORY)
  const history: string[] = raw ? JSON.parse(raw) : []
  history.unshift(id)

  // 最大件数を超えたら古いものを削除
  while (history.length > MAX_HISTORY) {
    const old = history.pop()
    if (old) localStorage.removeItem(`setlist:${old}`)
  }

  localStorage.setItem(KEY_HISTORY, JSON.stringify(history))
  return id
}

export function loadHistory(): { id: string; setlist: Setlist }[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    return ids.flatMap((id) => {
      const s = localStorage.getItem(`setlist:${id}`)
      if (!s) return []
      return [{ id, setlist: JSON.parse(s) as Setlist }]
    })
  } catch {
    return []
  }
}

export function clearCurrentSetlist(): void {
  localStorage.removeItem(KEY_CURRENT)
}
