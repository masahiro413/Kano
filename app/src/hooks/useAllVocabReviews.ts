import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { VocabReview } from '../types/firestore'

// staff向け進捗ダッシュボード(SPEC §4.4)用に、全生徒の単語帳SRS状態を購読する。
// キーは`${studentUid}_${vocabCardId}`だが、ここでは生徒ごとのMap<vocabCardId, VocabReview>
// にまとめ直して返す。
export function useAllVocabReviews() {
  const [reviewsByStudent, setReviewsByStudent] = useState<
    Map<string, Map<string, VocabReview>>
  >(new Map())
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    return onSnapshot(collection(db, 'vocabReviews'), (snapshot) => {
      const byStudent = new Map<string, Map<string, VocabReview>>()
      snapshot.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() } as VocabReview
        const studentMap =
          byStudent.get(data.studentUid) ?? new Map<string, VocabReview>()
        studentMap.set(data.vocabCardId, data)
        byStudent.set(data.studentUid, studentMap)
      })
      setReviewsByStudent(byStudent)
      setLoading(false)
    })
  }, [])

  return { reviewsByStudent, loading }
}
