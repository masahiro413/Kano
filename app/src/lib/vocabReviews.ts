import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { Grade } from 'ts-fsrs'
import { db } from './firebase'
import { computeNextReview } from './srs'
import type { VocabReview } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

// 生徒×単語カードごとに1件のレビュー状態を持つため、ドキュメントIDを
// studentUidとvocabCardIdから決定的に生成する(重複防止・直接参照のため)。
function reviewDocId(studentUid: string, vocabCardId: string) {
  return `${studentUid}_${vocabCardId}`
}

export function subscribeVocabReviews(
  studentUid: string,
  onChange: (reviews: Map<string, VocabReview>) => void,
) {
  const q = query(
    collection(requireDb(), 'vocabReviews'),
    where('studentUid', '==', studentUid),
  )
  return onSnapshot(q, (snapshot) => {
    const map = new Map<string, VocabReview>()
    snapshot.docs.forEach((d) => {
      const data = { id: d.id, ...d.data() } as VocabReview
      map.set(data.vocabCardId, data)
    })
    onChange(map)
  })
}

// 生徒の評価(Again/Hard/Good/Easy)を記録し、SRSアルゴリズムで次回復習日時を確定する。
export async function recordVocabReview(
  studentUid: string,
  vocabCardId: string,
  currentReview: VocabReview | null,
  grade: Grade,
) {
  const next = computeNextReview(currentReview, grade, new Date())
  await setDoc(doc(requireDb(), 'vocabReviews', reviewDocId(studentUid, vocabCardId)), {
    studentUid,
    vocabCardId,
    ...next,
    updatedAt: serverTimestamp(),
  })
}
