'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext, closestCenter,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatSeconds, getTimingStatus, cn } from '@/lib/utils'
import { saveCurrentSetlist, loadCurrentSetlist, defaultSetlist } from '@/lib/storage'
import { toast } from 'sonner'
import { Plus, Mic2, Radio, Link2, ListMusic, FilePlus, ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Setlist, SetlistItem, ItemType } from '@/types'
import SortableItem from './SortableItem'
import AddItemModal from './AddItemModal'
import ShareModal from './ShareModal'
import AppFooter from './AppFooter'

const INFINITE = 999999 * 60

interface Props {
  initialSetlist?: Setlist
}

export default function SetlistEditor({ initialSetlist }: Props) {
  const t = useTranslations()
  const [setlist, setSetlist] = useState<Setlist>(initialSetlist ?? defaultSetlist())
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addType, setAddType] = useState<ItemType>('song')
  const [editItem, setEditItem] = useState<SetlistItem | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (!initialSetlist) {
      const loaded = loadCurrentSetlist()
      setSetlist(loaded)
    }
  }, [initialSetlist])

  const update = useCallback((next: Setlist) => {
    setSetlist(next)
    saveCurrentSetlist(next)
  }, [])

  const setField = <K extends keyof Setlist>(key: K, value: Setlist[K]) => {
    update({ ...setlist, [key]: value })
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = setlist.items.findIndex((i) => i.id === active.id)
    const newIdx = setlist.items.findIndex((i) => i.id === over.id)
    update({ ...setlist, items: arrayMove(setlist.items, oldIdx, newIdx) })
  }

  const handleSaveItem = (item: SetlistItem) => {
    const exists = setlist.items.some((i) => i.id === item.id)
    const items = exists
      ? setlist.items.map((i) => (i.id === item.id ? item : i))
      : [...setlist.items, item]
    update({ ...setlist, items })
    toast.success(exists ? t('editor.updatedSuccess') : t('editor.addedSuccess'))
  }

  const handleDeleteItem = (id: string) => {
    update({ ...setlist, items: setlist.items.filter((i) => i.id !== id) })
  }

  const openAdd = (type: ItemType) => {
    setEditItem(null)
    setAddType(type)
    setAddModalOpen(true)
  }

  const playPreview = (item: SetlistItem) => {
    if (!item.preview_url) return
    if (playingId === item.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = item.preview_url
    } else {
      audioRef.current = new Audio(item.preview_url)
    }
    audioRef.current.onended = () => setPlayingId(null)
    audioRef.current.play()
    setPlayingId(item.id)
  }

  const openEdit = (item: SetlistItem) => {
    setEditItem(item)
    setAddType(item.type)
    setAddModalOpen(true)
  }

  const hasInfiniteItems = setlist.items.some(i => i.duration_seconds === 0)
  const totalSeconds = setlist.items.reduce((s, i) => s + i.duration_seconds, 0)
  const targetSeconds = setlist.target_seconds ?? 0
  const hasNoTarget = targetSeconds === 0 || targetSeconds >= INFINITE
  const showProgress = !hasNoTarget && !hasInfiniteItems
  const progressPct = showProgress ? Math.min((totalSeconds / targetSeconds) * 100, 100) : 0
  const status = showProgress ? getTimingStatus(totalSeconds, targetSeconds) : 'under'

  const statusColor  = { under: 'text-green-400', near: 'text-yellow-400', over: 'text-red-400' }[status]
  const progressColor = { under: 'bg-green-500',  near: 'bg-yellow-500',  over: 'bg-red-500'   }[status]

  const targetMinutes = targetSeconds > 0 ? Math.floor(targetSeconds / 60) : 0

  const totalMinutes = setlist.target_seconds >= INFINITE ? 0 : Math.round((setlist.target_seconds ?? 0) / 60)
  const hundreds = Math.floor(totalMinutes / 100)
  const tens = Math.floor((totalMinutes % 100) / 10)
  const ones = totalMinutes % 10

  const updateDigit = (place: 'hundreds' | 'tens' | 'ones', delta: number) => {
    const current = totalMinutes === 0 ? 45 : totalMinutes
    let h = Math.floor(current / 100)
    let t = Math.floor((current % 100) / 10)
    let o = current % 10
    if (place === 'hundreds') h = Math.max(0, Math.min(9, h + delta))
    if (place === 'tens') t = Math.max(0, Math.min(9, t + delta))
    if (place === 'ones') o = Math.max(0, Math.min(9, o + delta))
    const newMinutes = h * 100 + t * 10 + o
    setField('target_seconds', newMinutes === 0 ? INFINITE : newMinutes * 60)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary text-lg">{t('common.appName')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            className="text-muted-foreground hover:text-foreground text-xs gap-1"
            onClick={() => {
              if (setlist.items.length > 0 && !window.confirm(t('editor.newSetlistConfirm'))) return
              const def = defaultSetlist()
              update(def)
              toast.success(t('editor.newSetlistSuccess'))
            }}
          >
            <FilePlus className="w-3.5 h-3.5" />
            {t('editor.newSetlist')}
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setShareOpen(true)}
            disabled={setlist.items.length === 0}
          >
            <Link2 className="w-4 h-4 mr-1" />
            {t('editor.publishUrl')}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <Input
          value={setlist.band_name}
          onChange={(e) => setField('band_name', e.target.value)}
          placeholder={t('editor.bandNamePlaceholder')}
          className="bg-transparent border-0 border-b border-border rounded-none font-semibold text-lg text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary px-0"
        />
        <Input
          value={setlist.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder={t('editor.titlePlaceholder')}
          className="bg-transparent border-0 border-b border-border rounded-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-primary px-0"
        />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('editor.venueName')}</Label>
            <Input
              value={setlist.venue_name ?? ''}
              onChange={(e) => setField('venue_name', e.target.value)}
              placeholder={t('editor.venueName')}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('editor.eventDate')}</Label>
            <Input
              type="date"
              value={setlist.event_date ?? ''}
              onChange={(e) => setField('event_date', e.target.value)}
              className="bg-input border-border text-foreground h-8 text-sm w-full appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('editor.venueUrl')}</Label>
            <Input
              value={setlist.venue_url ?? ''}
              onChange={(e) => setField('venue_url', e.target.value)}
              placeholder="https://maps.google.com/..."
              className="bg-input border-border text-foreground placeholder:text-muted-foreground h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('editor.targetTime')}</Label>
            <div className="bg-input border border-border rounded-md h-8 px-2 flex items-center justify-center gap-0.5">
              {(['hundreds', 'tens', 'ones'] as const).map((place, i) => {
                const digit = [hundreds, tens, ones][i]
                return (
                  <div key={place} className="flex flex-col items-center">
                    <button
                      className="w-6 h-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground active:text-foreground"
                      onClick={() => updateDigit(place, 1)}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-sm w-6 text-center text-foreground leading-none select-none">
                      {totalMinutes === 0 ? (i === 0 ? '∞' : '') : digit}
                    </span>
                    <button
                      className="w-6 h-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground active:text-foreground"
                      onClick={() => updateDigit(place, -1)}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
              <span className="text-xs text-muted-foreground ml-1">分</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('editor.totalTime')}</span>
          <span className={cn('font-mono font-semibold text-lg', showProgress ? statusColor : 'text-foreground')}>
            {hasInfiniteItems ? '∞' : formatSeconds(totalSeconds)}
            <span className="text-muted-foreground font-normal text-sm ml-1">
              / {hasNoTarget ? '∞' : `${targetMinutes}:00`}
            </span>
          </span>
        </div>
        {showProgress && (
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', progressColor)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('editor.songs', { count: setlist.items.length })}</span>
          <span>
            {showProgress
              ? totalSeconds <= targetSeconds
                ? t('editor.remaining', { time: formatSeconds(targetSeconds - totalSeconds) })
                : t('editor.over', { time: formatSeconds(totalSeconds - targetSeconds) })
              : ''}
          </span>
        </div>
      </div>

      {/* Item list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={setlist.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {setlist.items.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground text-sm">
                {t('editor.emptyList')}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {setlist.items.map((item, idx) => (
                  <SortableItem
                    key={item.id} item={item} index={idx}
                    onEdit={openEdit} onDelete={handleDeleteItem}
                    playingId={playingId} onPlay={playPreview}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>

        <div className="border-t border-border p-3 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => openAdd('song')}
          >
            <Plus className="w-4 h-4 mr-1" />{t('editor.addSong')}
          </Button>
          <Button size="sm" variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => openAdd('mc')}
          >
            <Mic2 className="w-4 h-4 mr-1" />{t('editor.addMC')}
          </Button>
          <Button size="sm" variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            onClick={() => openAdd('se')}
          >
            <Radio className="w-4 h-4 mr-1" />{t('editor.addSE')}
          </Button>
        </div>
      </div>

      <AddItemModal
        open={addModalOpen}
        onClose={() => { setAddModalOpen(false); setEditItem(null) }}
        itemType={addType}
        editItem={editItem}
        onSave={handleSaveItem}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        setlist={setlist}
      />
      <AppFooter />
    </main>
  )
}
