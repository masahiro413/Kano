import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AnswerLog, QuestionFormat } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export interface AnswerLogInput {
  studentUid: string
  questionSetId: string
  questionId: string
  format: QuestionFormat
  correct: boolean
  isPlacementTest: boolean
}

export async function recordAnswerLog(input: AnswerLogInput) {
  await addDoc(collection(requireDb(), 'answerLogs'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

// レベル自動昇降級判定(SPEC §4.2.1)のため、直近N件の解答履歴を取得する。
export async function getRecentAnswerLogs(
  studentUid: string,
  count: number,
): Promise<AnswerLog[]> {
  const q = query(
    collection(requireDb(), 'answerLogs'),
    where('studentUid', '==', studentUid),
    orderBy('createdAt', 'desc'),
    limit(count),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AnswerLog)
}
