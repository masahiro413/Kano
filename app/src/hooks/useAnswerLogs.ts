import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { AnswerLog } from '../types/firestore'

// 生徒本人の解答履歴を購読する(進捗ダッシュボード、SPEC §4.4)。
export function useAnswerLogs(studentUid: string | undefined) {
  const [logs, setLogs] = useState<AnswerLog[]>([])
  const [loading, setLoading] = useState(!!db && !!studentUid)

  useEffect(() => {
    if (!db || !studentUid) return

    const q = query(
      collection(db, 'answerLogs'),
      where('studentUid', '==', studentUid),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AnswerLog))
      setLoading(false)
    })
  }, [studentUid])

  return { logs, loading }
}
