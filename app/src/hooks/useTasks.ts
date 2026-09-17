import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Task } from '../types/firestore'

// 自分が所有するタスクのみを購読する(SPEC §3)。
export function useTasks(ownerUid: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(!!db && !!ownerUid)

  useEffect(() => {
    if (!db || !ownerUid) return

    const q = query(
      collection(db, 'tasks'),
      where('ownerUid', '==', ownerUid),
      orderBy('createdAt', 'desc'),
    )

    return onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Task))
      setLoading(false)
    })
  }, [ownerUid])

  return { tasks, loading }
}
