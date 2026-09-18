import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Question } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

// Omitは合成型(discriminated union)に対して分配しないため、
// Question全体に直接Omitをかけるとformatごとの型の絞り込みが失われる。
// そのためTがunionの各メンバーに分配されるヘルパーを介する。
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

export type QuestionInput = DistributiveOmit<Question, 'id' | 'createdAt'>

function questionsCollection(setId: string) {
  return collection(requireDb(), 'questionSets', setId, 'questions')
}

export async function addQuestion(setId: string, input: QuestionInput) {
  await addDoc(questionsCollection(setId), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function updateQuestion(setId: string, id: string, input: QuestionInput) {
  await updateDoc(doc(questionsCollection(setId), id), { ...input })
}

export async function deleteQuestion(setId: string, id: string) {
  await deleteDoc(doc(questionsCollection(setId), id))
}
