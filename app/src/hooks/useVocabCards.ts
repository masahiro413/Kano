import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { VocabCard } from '../types/firestore'

export function useVocabCards() {
  const [cards, setCards] = useState<VocabCard[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    const q = query(collection(db, 'vocabCards'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
      setCards(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as VocabCard))
      setLoading(false)
    })
  }, [])

  return { cards, loading }
}
