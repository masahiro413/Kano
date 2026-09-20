import type { Timestamp } from 'firebase/firestore'
import { isDue } from './srs'
import type {
  AnswerLog,
  QuestionFormat,
  VocabCard,
  VocabReview,
} from '../types/firestore'

export interface AccuracyStats {
  totalCount: number
  correctCount: number
  accuracyPercent: number
}

export function computeAccuracy(logs: AnswerLog[]): AccuracyStats {
  const totalCount = logs.length
  const correctCount = logs.filter((log) => log.correct).length
  return {
    totalCount,
    correctCount,
    accuracyPercent: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
  }
}

export function groupAccuracyByFormat(
  logs: AnswerLog[],
): Map<QuestionFormat, AccuracyStats> {
  const byFormat = new Map<QuestionFormat, AnswerLog[]>()
  for (const log of logs) {
    const arr = byFormat.get(log.format) ?? []
    arr.push(log)
    byFormat.set(log.format, arr)
  }

  const result = new Map<QuestionFormat, AccuracyStats>()
  for (const [format, formatLogs] of byFormat) {
    result.set(format, computeAccuracy(formatLogs))
  }
  return result
}

export function groupLogsByStudent(logs: AnswerLog[]): Map<string, AnswerLog[]> {
  const map = new Map<string, AnswerLog[]>()
  for (const log of logs) {
    const arr = map.get(log.studentUid) ?? []
    arr.push(log)
    map.set(log.studentUid, arr)
  }
  return map
}

export interface VocabStats {
  totalCards: number
  learnedCards: number
  dueCount: number
}

// courseCards: 生徒のコース×レベルに一致する単語カード。reviews: 生徒自身のSRS状態。
export function computeVocabStats(
  courseCards: VocabCard[],
  reviews: Map<string, VocabReview>,
  now: Date,
): VocabStats {
  let learnedCards = 0
  let dueCount = 0
  for (const card of courseCards) {
    const review = reviews.get(card.id) ?? null
    if (review && review.reps > 0) learnedCards += 1
    if (isDue(review, now)) dueCount += 1
  }
  return { totalCards: courseCards.length, learnedCards, dueCount }
}

// answerLogs/levelChangesのcreatedAtはFirestoreのserverTimestamp()で書き込むため、
// 読み取り時はTimestamp型で返る(ISO文字列型はFirestoreスキーマ上の簡略表記)。
// 両方の形を安全に扱うための変換ヘルパー。
type FirestoreDateValue = string | Timestamp | Date | null | undefined

export function formatDate(value: FirestoreDateValue): string {
  if (!value) return '—'
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string'
        ? new Date(value)
        : value.toDate()
  return date.toLocaleDateString()
}
