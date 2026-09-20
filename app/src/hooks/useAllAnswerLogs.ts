import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { AnswerLog } from '../types/firestore'

// staff向け進捗ダッシュボード(SPEC §4.4)用に、全生徒の解答履歴を購読する。
// Firestoreルール上はstaffなら全件readできるため、フィルタなしで取得し
// 生徒ごとの集計はクライアント側で行う(lib/progressStats.tsのgroupLogsByStudent)。
export function useAllAnswerLogs() {
  const [logs, setLogs] = useState<AnswerLog[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    return onSnapshot(collection(db, 'answerLogs'), (snapshot) => {
      setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AnswerLog))
      setLoading(false)
    })
  }, [])

  return { logs, loading }
}
