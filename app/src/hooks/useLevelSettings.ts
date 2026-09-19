import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { DEFAULT_LEVEL_THRESHOLD_SETTINGS } from '../lib/levelSettings'
import type { LevelThresholdSettings } from '../types/firestore'

export function useLevelSettings() {
  const [settings, setSettings] = useState<LevelThresholdSettings>(
    DEFAULT_LEVEL_THRESHOLD_SETTINGS,
  )
  const [loading, setLoading] = useState(!!db)

  useEffect(() => {
    if (!db) return

    return onSnapshot(doc(db, 'settings', 'levelThresholds'), (snapshot) => {
      setSettings(
        snapshot.exists()
          ? { ...DEFAULT_LEVEL_THRESHOLD_SETTINGS, ...snapshot.data() }
          : DEFAULT_LEVEL_THRESHOLD_SETTINGS,
      )
      setLoading(false)
    })
  }, [])

  return { settings, loading }
}
