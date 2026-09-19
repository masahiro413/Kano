import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { subscribeVocabReviews } from '../lib/vocabReviews'
import type { VocabReview } from '../types/firestore'

export function useVocabReviews(studentUid: string | undefined) {
  const [reviews, setReviews] = useState<Map<string, VocabReview>>(new Map())
  const [loading, setLoading] = useState(!!db && !!studentUid)

  useEffect(() => {
    if (!db || !studentUid) return

    return subscribeVocabReviews(studentUid, (map) => {
      setReviews(map)
      setLoading(false)
    })
  }, [studentUid])

  return { reviews, loading }
}
