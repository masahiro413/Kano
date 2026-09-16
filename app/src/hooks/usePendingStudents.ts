import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { StudentProfile } from '../types/firestore'

// 承認待ち生徒の一覧をリアルタイム購読する(SPEC §2.2, staff向け承認待ち一覧)。
export function usePendingStudents() {
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('approvalStatus', '==', 'pending'),
    )

    return onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map((d) => d.data() as StudentProfile))
      setLoading(false)
    })
  }, [])

  return { students, loading }
}
