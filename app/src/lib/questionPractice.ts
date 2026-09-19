import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { getRecentAnswerLogs } from './answerLogs'
import { evaluatePromotionDemotion, LEVEL_ORDER } from './levelEvaluation'
import { getLevelSettings } from './levelSettings'
import { isAnswerCorrect, isScorable, type QuestionAnswer } from './questionScoring'
import type { Level, Question } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export interface QuestionPracticeResult {
  scorePercent: number
  scorableCount: number
  correctCount: number
  levelChange: Level | null
}

// 通常の問題演習の採点・解答履歴記録・レベル自動昇降級判定をまとめて行う(SPEC §4.2.1)。
// プレースメントテスト(lib/placementTest.ts)とは異なり、この演習単体では生徒のレベルは
// 即座には決まらない。解答履歴を記録したうえで直近N問の正答率を再評価し、
// 昇級・降級の条件を満たした場合のみレベルを変更する。
export async function submitQuestionPractice(
  studentUid: string,
  questionSetId: string,
  questions: Question[],
  answers: Map<string, QuestionAnswer>,
  currentLevel: Level,
): Promise<QuestionPracticeResult> {
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
      isPlacementTest: false,
      createdAt: serverTimestamp(),
    })
  }

  await batch.commit()

  const scorePercent = scorableCount > 0 ? (correctCount / scorableCount) * 100 : 0

  const settings = await getLevelSettings()
  const recentLogs = await getRecentAnswerLogs(studentUid, settings.recentQuestionCount)
  const newLevel = evaluatePromotionDemotion(
    recentLogs.map((log) => log.correct),
    currentLevel,
    settings,
  )

  if (newLevel) {
    const levelBatch = writeBatch(database)
    levelBatch.update(doc(database, 'users', studentUid), { level: newLevel })

    const levelChangeRef = doc(collection(database, 'levelChanges'))
    const reason =
      LEVEL_ORDER.indexOf(newLevel) > LEVEL_ORDER.indexOf(currentLevel)
        ? 'auto_promotion'
        : 'auto_demotion'
    levelBatch.set(levelChangeRef, {
      studentUid,
      fromLevel: currentLevel,
      toLevel: newLevel,
      reason,
      createdAt: serverTimestamp(),
    })

    await levelBatch.commit()
  }

  return { scorePercent, scorableCount, correctCount, levelChange: newLevel }
}
