'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { GripVertical, Pencil, Trash2, Music, Mic2, Radio, Play, Pause, Pin } from 'lucide-react'
import { formatSeconds, cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { SetlistItem } from '@/types'

const typeConfig = {
  song:  { icon: Music, color: 'text-primary' },
  mc:    { icon: Mic2,  color: 'text-blue-400' },
  se:    { icon: Radio, color: 'text-purple-400' },
}

interface Props {
  item: SetlistItem
  index: number
  onEdit: (item: SetlistItem) => void
  onDelete: (id: string) => void
  onPinGenerated?: (id: string) => void
  playingId?: string | null
  onPlay?: (item: SetlistItem) => void
}

export default function SortableItem({ item, index, onEdit, onDelete, onPinGenerated, playingId, onPlay }: Props) {
  const t = useTranslations('editor')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const cfg = typeConfig[item.type] ?? typeConfig.song
  const Icon = cfg.icon
  const isPlaying = playingId === item.id
  const isGenerated = item.type === 'song' && item.generated === true

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 hover:bg-secondary/50 transition-colors group',
        isDragging && 'bg-secondary/80 rounded-lg'
      )}
    >
      <button
        className="drag-handle text-muted-foreground/40 hover:text-muted-foreground flex-shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <span className="text-muted-foreground text-xs w-5 text-right flex-shrink-0 font-mono">
        {index + 1}
      </span>

      <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />

      {/* タイトル + badge + アーティスト */}
      <div className="flex-1 min-w-0">
        <div className="text-foreground text-sm truncate">{item.title || '(無題)'}</div>
        {/* badge 行（タイトル下に分離してスマホでも潰れない） */}
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          {item.type === 'mc' && (
            <span className="rounded-full border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-foreground shrink-0">MC</span>
          )}
          {item.type === 'se' && (
            <span className="rounded-full border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-foreground shrink-0">SE</span>
          )}
          {item.type === 'song' && isGenerated && (
            <span className="rounded-full border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary shrink-0">{t('itemLabelGenerated')}</span>
          )}
          {item.type === 'song' && !isGenerated && (
            <span className="rounded-full border border-border bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground shrink-0">{t('itemLabelFixed')}</span>
          )}
          {item.artist && (
            <span className="text-xs text-muted-foreground truncate">{item.artist}</span>
          )}
        </div>
        {item.note && (
          <span className="text-xs text-muted-foreground/60 truncate block">{item.note}</span>
        )}
        {item.deezer_id && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <a
              href={`https://www.deezer.com/track/${item.deezer_id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Deezer"
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded-full bg-[#9f10bc]/20 flex items-center justify-center hover:bg-[#9f10bc]/40 transition-colors flex-shrink-0"
            >
              <span className="text-[8px] font-bold text-[#9f10bc]">D</span>
            </a>
          </div>
        )}
      </div>

      {/* Preview play button */}
      {item.preview_url && onPlay && (
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(item) }}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
            isPlaying
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100'
          )}
          title="30秒プレビュー"
        >
          {isPlaying
            ? <Pause className="w-3 h-3" />
            : <Play className="w-3 h-3 ml-0.5" />}
        </button>
      )}

      <span className="text-muted-foreground text-xs font-mono flex-shrink-0 w-10 text-right">
        {formatSeconds(item.duration_seconds)}
      </span>

      {/* アクションボタン: スマホ常時表示 / sm以上 hover表示 */}
      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isGenerated && onPinGenerated && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 sm:w-7 sm:px-0"
            title={t('pinGeneratedSong')}
            onClick={() => onPinGenerated(item.id)}
          >
            <Pin className="w-3 h-3 sm:mr-0 mr-1" />
            <span className="sm:hidden">{t('pinGeneratedSong')}</span>
          </Button>
        )}
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(item)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}
