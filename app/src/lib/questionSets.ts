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

export interface QuestionSetInput {
  courseId: string
  level: Level
  title: string
  description?: string
  isPlacementTest: boolean
}

export async function addQuestionSet(input: QuestionSetInput) {
  await addDoc(collection(requireDb(), 'questionSets'), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function updateQuestionSet(id: string, input: QuestionSetInput) {
  await updateDoc(doc(requireDb(), 'questionSets', id), { ...input })
}

export async function deleteQuestionSet(id: string) {
  await deleteDoc(doc(requireDb(), 'questionSets', id))
}
