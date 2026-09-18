import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Level } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export interface VocabCardInput {
  courseId: string
  level: Level
  term: string
  meaning: string
  exampleSentence?: string
}

export async function addVocabCard(input: VocabCardInput) {
  await addDoc(collection(requireDb(), 'vocabCards'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function updateVocabCard(id: string, input: VocabCardInput) {
  await updateDoc(doc(requireDb(), 'vocabCards', id), { ...input })
}

export async function deleteVocabCard(id: string) {
  await deleteDoc(doc(requireDb(), 'vocabCards', id))
}
