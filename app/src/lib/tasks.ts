import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Priority } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

// タスクは所有者(ownerUid)ごとに完全に独立している。共有タスク一覧は存在しない(SPEC §3)。
export async function addTask(ownerUid: string, title: string, priority: Priority) {
  await addDoc(collection(requireDb(), 'tasks'), {
    ownerUid,
    title,
    priority,
    completed: false,
    createdAt: serverTimestamp(),
  })
}

export async function setTaskCompleted(taskId: string, completed: boolean) {
  await updateDoc(doc(requireDb(), 'tasks', taskId), { completed })
}

export async function deleteTask(taskId: string) {
  await deleteDoc(doc(requireDb(), 'tasks', taskId))
}
