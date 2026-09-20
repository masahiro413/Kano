import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { StudentProfile } from '../types/firestore'

// 承認済み生徒の一覧をリアルタイム購読する(staff向け進捗ダッシュボード、SPEC §4.4)。
export function useApprovedStudents() {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('approvalStatus', '==', 'approved'),
    )

    return onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map((d) => d.data() as StudentProfile))
      setLoading(false)
    })
  }, [])

  return { students, loading }
}
