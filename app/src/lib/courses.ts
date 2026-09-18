import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function addCourse(name: string, description: string) {
  await addDoc(collection(requireDb(), 'courses'), { name, description })
}

export async function updateCourse(id: string, name: string, description: string) {
  await updateDoc(doc(requireDb(), 'courses', id), { name, description })
}

export async function deleteCourse(id: string) {
  await deleteDoc(doc(requireDb(), 'courses', id))
}
