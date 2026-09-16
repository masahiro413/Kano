import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { ApprovalStatus } from '../types/firestore'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

// staffなら誰でもボタン一つで承認/拒否できる(理由入力・通知は行わない。SPEC §2.2)。
export async function setStudentApprovalStatus(uid: string, status: ApprovalStatus) {
  await updateDoc(doc(requireDb(), 'users', uid), { approvalStatus: status })
}
