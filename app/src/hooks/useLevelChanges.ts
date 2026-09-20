import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { LevelChange } from '../types/firestore'

// 生徒本人のレベル変更履歴を購読する(進捗ダッシュボード、SPEC §4.4)。
export function useLevelChanges(studentUid: string | undefined) {
  const [levelChanges, setLevelChanges] = useState<LevelChange[]>([])
  const [loading, setLoading] = useState(!!db && !!studentUid)

  useEffect(() => {
    if (!db || !studentUid) return

    const q = query(
      collection(db, 'levelChanges'),
      where('studentUid', '==', studentUid),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snapshot) => {
      setLevelChanges(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as LevelChange),
      )
      setLoading(false)
    })
  }, [studentUid])

  return { levelChanges, loading }
}
