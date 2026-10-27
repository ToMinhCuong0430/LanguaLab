/**
 * constants/badges.ts
 * Single source of truth for all badge tone + variant + label mappings.
 * Use these helpers everywhere instead of hardcoding inline badge spans.
 */

import type { Component } from 'vue'
import { Lock } from '@lucide/vue'

export type BadgeTone =
  | 'neutral' | 'blue' | 'green' | 'yellow' | 'pink'
  | 'orange' | 'violet' | 'coral' | 'cyan'

export type BadgeVariant = 'soft' | 'solid' | 'outline'

export interface BadgeConfig {
  tone: BadgeTone
  variant?: BadgeVariant
  label?: string
  icon?: Component
  uppercase?: boolean
}

// ─────────────────────────────────────────────────────────────
// 1. VOCABULARY / LANGUAGE LEVEL
// ─────────────────────────────────────────────────────────────
/**
 * levelBadge('A2') → green soft
 * Supports CEFR (A1-C2), HSK (1-6), JLPT (N1-N5), ranges ("A2 - B1")
 */
export function levelBadge(level: string): BadgeConfig {
  const upper = level.toUpperCase()

  // Detect highest level in range (e.g. "A2 - B1" → "B1")
  const highestCefr = (() => {
    const matches = upper.match(/([ABC][12])/g)
    if (!matches) return null
    const order = ['A1','A2','B1','B2','C1','C2']
    return matches.sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] ?? null
  })()

  if (highestCefr) {
    if (['A1','A2'].includes(highestCefr)) return { tone: 'green', label: level }
    if (['B1','B2'].includes(highestCefr)) return { tone: 'blue',  label: level }
    return { tone: 'violet', label: level }
  }

  // HSK
  const hskMatch = upper.match(/HSK\s*([1-6])/)
  if (hskMatch) {
    const n = Number(hskMatch[1])
    if (n <= 2) return { tone: 'green',  label: level }
    if (n <= 4) return { tone: 'blue',   label: level }
    return { tone: 'violet', label: level }
  }

  // JLPT
  const jlptMatch = upper.match(/N([1-5])/)
  if (jlptMatch) {
    const n = Number(jlptMatch[1])
    if (n >= 4) return { tone: 'green',  label: level }
    if (n >= 2) return { tone: 'blue',   label: level }
    return { tone: 'violet', label: level }
  }

  return { tone: 'neutral', label: level }
}

// ─────────────────────────────────────────────────────────────
// 2. LEARN STATUS
// ─────────────────────────────────────────────────────────────
type LearnStatus = 'new' | 'learning' | 'done' | 'locked' | 'coming_soon'

const LEARN_STATUS_MAP: Record<LearnStatus, BadgeConfig> = {
  new:         { tone: 'neutral', label: 'Chưa học' },
  learning:    { tone: 'yellow',  label: 'Đang học'  },
  done:        { tone: 'green',   label: 'Đã xong'   },
  locked:      { tone: 'neutral', label: 'Khoá', icon: Lock },
  coming_soon: { tone: 'neutral', variant: 'outline', label: 'Sắp ra mắt' },
}

export function learnStatusBadge(status: LearnStatus | string): BadgeConfig {
  return LEARN_STATUS_MAP[status as LearnStatus] ?? { tone: 'neutral', label: status }
}

// ─────────────────────────────────────────────────────────────
// 3. MEDIA TYPE
// ─────────────────────────────────────────────────────────────
type MediaType = 'video' | 'podcast' | string

export function mediaTypeBadge(type: MediaType): BadgeConfig {
  if (type === 'video')   return { tone: 'blue',  label: 'Video'   }
  if (type === 'podcast') return { tone: 'pink',  label: 'Podcast' }
  return { tone: 'neutral', label: type }
}

// ─────────────────────────────────────────────────────────────
// 4. READING GENRE
// ─────────────────────────────────────────────────────────────
type ReadingType = 'short_story' | 'novel' | 'play' | 'news' | 'non_fiction' | string

const READING_GENRE_MAP: Record<string, BadgeConfig> = {
  short_story:  { tone: 'green',  label: 'Truyện ngắn'   },
  novel:        { tone: 'violet', label: 'Tiểu thuyết'   },
  play:         { tone: 'pink',   label: 'Kịch'          },
  news:         { tone: 'coral',  label: 'Báo chí'       },
  non_fiction:  { tone: 'blue',   label: 'Sách tri thức' },
}

export function readingGenreBadge(type: ReadingType): BadgeConfig {
  return READING_GENRE_MAP[type] ?? { tone: 'neutral', label: type }
}

// ─────────────────────────────────────────────────────────────
// 5. IELTS SKILL
// ─────────────────────────────────────────────────────────────
type IeltsSkill = 'listening' | 'reading' | 'writing' | 'speaking' | string

const IELTS_SKILL_MAP: Record<string, BadgeConfig> = {
  listening: { tone: 'blue',   label: 'Listening' },
  reading:   { tone: 'green',  label: 'Reading'   },
  writing:   { tone: 'orange', label: 'Writing'   },
  speaking:  { tone: 'pink',   label: 'Speaking'  },
}

export function ieltsSkillBadge(skill: IeltsSkill): BadgeConfig {
  const key = skill.toLowerCase()
  return IELTS_SKILL_MAP[key] ?? { tone: 'neutral', label: skill }
}

// ─────────────────────────────────────────────────────────────
// 6. IELTS BAND SCORE
// ─────────────────────────────────────────────────────────────
export function bandBadge(band: number | string | null | undefined): BadgeConfig {
  const b = typeof band === 'string' ? parseFloat(band) : (band ?? 0)
  const label = b ? `Band ${b}` : 'N/A'
  if (b >= 7.0) return { tone: 'green',   label }
  if (b >= 6.0) return { tone: 'yellow',  label }
  if (b >= 5.0) return { tone: 'orange',  label }
  if (b > 0)    return { tone: 'coral',   label }
  return { tone: 'neutral', label }
}

// ─────────────────────────────────────────────────────────────
// 7. FEATURE REQUEST STATUS
// ─────────────────────────────────────────────────────────────
type RequestStatus = 'pending' | 'in_progress' | 'done' | 'rejected' | string

const REQUEST_STATUS_MAP: Record<string, BadgeConfig> = {
  pending:     { tone: 'neutral', label: 'Đang chờ'    },
  in_progress: { tone: 'yellow',  label: 'Đang làm'   },
  done:        { tone: 'green',   label: 'Đã xong'    },
  rejected:    { tone: 'coral',   label: 'Từ chối'    },
}

export function requestStatusBadge(status: RequestStatus): BadgeConfig {
  return REQUEST_STATUS_MAP[status] ?? { tone: 'neutral', label: status }
}

// ─────────────────────────────────────────────────────────────
// 8. SPECIAL / GAMIFICATION BADGES
// ─────────────────────────────────────────────────────────────
/** XP badge – always yellow solid */
export function xpBadge(xp: number | string): BadgeConfig {
  return { tone: 'yellow', variant: 'solid', label: `+${xp} XP` }
}

/** Streak badge – orange solid */
export function streakBadge(days: number): BadgeConfig {
  return { tone: 'orange', variant: 'solid', label: `🔥 ${days} ngày` }
}

/** "Nổi bật" / featured – yellow soft */
export const FEATURED_BADGE: BadgeConfig = { tone: 'yellow', label: 'Nổi bật' }

/** "Mới" – cyan soft */
export const NEW_BADGE: BadgeConfig = { tone: 'cyan', label: 'Mới' }

/** "Thử nghiệm" – coral outline */
export const BETA_BADGE: BadgeConfig = { tone: 'coral', variant: 'outline', label: 'Beta' }
