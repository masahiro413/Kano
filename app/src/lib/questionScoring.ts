import type { Question } from '../types/firestore'

// 発音・ロールプレイ形式は現状自動採点を実装していないため対象外(SPEC §4.5、Phase 7で対応)。
export type ScorableQuestion = Extract<
  Question,
  { format: 'choice' | 'free_text' | 'reorder' | 'error_identification' }
>

export function isScorable(question: Question): question is ScorableQuestion {
  return (
    question.format === 'choice' ||
    question.format === 'free_text' ||
    question.format === 'reorder' ||
    question.format === 'error_identification'
  )
}

export type QuestionAnswer =
  | { format: 'choice'; selectedIndex: number }
  | { format: 'free_text'; text: string }
  | { format: 'reorder'; order: string[] }
  | { format: 'error_identification'; selectedSegmentIndex: number }

function normalizeFreeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

// 複数の正解パターンを許容する記述式の採点方式(SPEC §4.1.3)。
// 完全一致判定だが、前後の空白・連続する空白・大文字小文字の違いは許容する。
export function isAnswerCorrect(
  question: ScorableQuestion,
  answer: QuestionAnswer,
): boolean {
  if (question.format !== answer.format) return false

  switch (question.format) {
    case 'choice':
      return answer.format === 'choice' && answer.selectedIndex === question.correctIndex
    case 'free_text':
      return (
        answer.format === 'free_text' &&
        question.acceptedAnswers.some(
          (accepted) => normalizeFreeText(accepted) === normalizeFreeText(answer.text),
        )
      )
    case 'reorder':
      return (
        answer.format === 'reorder' &&
        answer.order.length === question.pieces.length &&
        answer.order.every((piece, index) => piece === question.pieces[index])
      )
    case 'error_identification':
      return (
        answer.format === 'error_identification' &&
        answer.selectedSegmentIndex === question.incorrectSegmentIndex
      )
  }
}
