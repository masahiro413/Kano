import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import type { VocabReview } from '../types/firestore'

// SRSアルゴリズムは自前実装せず、既存OSSライブラリ ts-fsrs(FSRS)を導入して利用する
// (SPEC §4.1)。パラメータは未調整のままライブラリのデフォルト値を使う。
const scheduler = fsrs()

export type NextReviewState = Omit<
  VocabReview,
  'id' | 'studentUid' | 'vocabCardId' | 'updatedAt'
>

function reviewToCard(review: VocabReview | null, now: Date): Card {
  if (!review) return createEmptyCard(now)
  return {
    due: new Date(review.due),
    stability: review.stability,
    difficulty: review.difficulty,
    // elapsed_daysはts-fsrs 6.0で廃止予定のレガシーフィールドで、
    // due/last_review/nowから内部的に再計算されるため保存していない。
    elapsed_days: 0,
    scheduled_days: review.scheduledDays,
    learning_steps: review.learningSteps,
    reps: review.reps,
    lapses: review.lapses,
    state: review.state,
    last_review: review.lastReview ? new Date(review.lastReview) : undefined,
  }
}

// 生徒の評価(Again/Hard/Good/Easy)から次回復習日時などのSRS状態を計算する。
export function computeNextReview(
  review: VocabReview | null,
  grade: Grade,
  now: Date,
): NextReviewState {
  const card = reviewToCard(review, now)
  const { card: nextCard } = scheduler.next(card, now, grade)
  return {
    due: nextCard.due.toISOString(),
    stability: nextCard.stability,
    difficulty: nextCard.difficulty,
    scheduledDays: nextCard.scheduled_days,
    learningSteps: nextCard.learning_steps,
    reps: nextCard.reps,
    lapses: nextCard.lapses,
    state: nextCard.state,
    lastReview: (nextCard.last_review ?? now).toISOString(),
  }
}

// 未学習(レビュー記録なし)のカードと、復習予定日を過ぎたカードを出題対象とする。
export function isDue(review: VocabReview | null, now: Date): boolean {
  if (!review) return true
  return new Date(review.due).getTime() <= now.getTime()
}
