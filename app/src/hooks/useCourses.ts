import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import type { Course } from '../types/firestore'

// courses/{courseId}の一覧を購読する。CMS(Phase 3)実装まではFirebaseコンソールで
// 手動投入したコースを読み取る想定。
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    return onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Course))
      setLoading(false)
    })
  }, [])

  return { courses, loading }
}
