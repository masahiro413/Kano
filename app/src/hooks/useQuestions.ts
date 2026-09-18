import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Question } from '../types/firestore'

export function useQuestions(setId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    const q = query(
      collection(db, 'questionSets', setId, 'questions'),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Question))
      setLoading(false)
    })
  }, [setId])

  return { questions, loading }
}
