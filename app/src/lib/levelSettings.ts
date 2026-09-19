import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { LevelThresholdSettings } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

const SETTINGS_DOC_ID = 'levelThresholds'

// SPEC §4.2.1/§4.2.2に例示された初期値。staffが未設定の間はこの値を使う。
export const DEFAULT_LEVEL_THRESHOLD_SETTINGS: LevelThresholdSettings = {
  placementAdvancedMin: 80,
  placementIntermediateMin: 40,
  promotionThreshold: 80,
  demotionThreshold: 40,
  recentQuestionCount: 20,
}

function settingsDocRef() {
  return doc(requireDb(), 'settings', SETTINGS_DOC_ID)
}

export async function getLevelSettings(): Promise<LevelThresholdSettings> {
  const snapshot = await getDoc(settingsDocRef())
  if (!snapshot.exists()) return DEFAULT_LEVEL_THRESHOLD_SETTINGS
  return { ...DEFAULT_LEVEL_THRESHOLD_SETTINGS, ...snapshot.data() }
}

export async function updateLevelSettings(settings: LevelThresholdSettings) {
  await setDoc(settingsDocRef(), settings)
}
