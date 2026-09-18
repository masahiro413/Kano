import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { ListeningMaterial } from '../types/firestore'

export function useListeningMaterials() {
  const [materials, setMaterials] = useState<ListeningMaterial[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    const q = query(collection(db, 'listeningMaterials'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
      setMaterials(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ListeningMaterial),
      )
      setLoading(false)
    })
  }, [])

  return { materials, loading }
}
