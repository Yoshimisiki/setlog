import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import LZString from "lz-string"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function parseMMSS(value: string): number {
  const parts = value.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0
    const s = parseInt(parts[1], 10) || 0
    return m * 60 + s
  }
  return parseInt(value, 10) || 0
}

export function getTimingStatus(totalSeconds: number, targetSeconds: number): 'under' | 'near' | 'over' {
  const diff = targetSeconds - totalSeconds
  if (diff > 300) return 'under'
  if (diff >= -300) return 'near'
  return 'over'
}

export function encodeSetlist(setlist: unknown): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(setlist))
}

export function decodeSetlist<T>(hash: string): T | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(hash)
    if (decompressed) {
      return JSON.parse(decompressed) as T
    }
    // Fallback: try legacy btoa format
    return JSON.parse(decodeURIComponent(escape(atob(hash)))) as T
  } catch {
    return null
  }
}
