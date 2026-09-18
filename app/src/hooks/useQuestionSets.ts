import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { QuestionSet } from '../types/firestore'

export function useQuestionSets() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    const q = query(collection(db, 'questionSets'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
      setQuestionSets(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as QuestionSet),
      )
      setLoading(false)
    })
  }, [])

  return { questionSets, loading }
}
