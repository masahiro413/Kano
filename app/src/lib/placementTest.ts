import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { determineInitialLevel } from './levelEvaluation'
import { getLevelSettings } from './levelSettings'
import { isAnswerCorrect, isScorable, type QuestionAnswer } from './questionScoring'
import type { Level, Question } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export interface PlacementTestResult {
  level: Level
  scorePercent: number
  scorableCount: number
  correctCount: number
}

// プレースメントテストの採点・結果反映をまとめて行う(SPEC §4.2.2)。
// - 発音・ロールプレイ形式は採点対象外(スコア算出の分母に含めない)
// - 解答履歴(answerLogs)・レベル変更履歴(levelChanges)・本人のレベル確定を
//   1つのバッチ書き込みとして行う
export async function submitPlacementTest(
  studentUid: string,
  questionSetId: string,
  questions: Question[],
  answers: Map<string, QuestionAnswer>,
): Promise<PlacementTestResult> {
  const settings = await getLevelSettings()
  const database = requireDb()

  let correctCount = 0
  let scorableCount = 0
  const batch = writeBatch(database)

  for (const question of questions) {
    if (!isScorable(question)) continue
    const answer = answers.get(question.id)
    if (!answer) continue

    scorableCount += 1
    const correct = isAnswerCorrect(question, answer)
    if (correct) correctCount += 1

    const logRef = doc(collection(database, 'answerLogs'))
    batch.set(logRef, {
      studentUid,
      questionSetId,
      questionId: question.id,
      format: question.format,
      correct,
      isPlacementTest: true,
      createdAt: serverTimestamp(),
    })
  }

  const scorePercent = scorableCount > 0 ? (correctCount / scorableCount) * 100 : 0
  const level = determineInitialLevel(scorePercent, settings)

  batch.update(doc(database, 'users', studentUid), {
    level,
    placementTestCompleted: true,
  })

  const levelChangeRef = doc(collection(database, 'levelChanges'))
  batch.set(levelChangeRef, {
    studentUid,
    fromLevel: null,
    toLevel: level,
    reason: 'placement_test',
    createdAt: serverTimestamp(),
  })

  await batch.commit()

  return { level, scorePercent, scorableCount, correctCount }
}
