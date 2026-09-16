import { deleteApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, createSecondaryFirebaseApp, db } from './firebase'
import type { DisplayLanguage, StaffProfile, StudentProfile } from '../types/firestore'

function requireAuth() {
  if (!auth) throw new Error('Firebase is not configured')
  return auth
}

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(requireAuth(), email, password)
}

export async function signOutUser() {
  await signOut(requireAuth())
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(requireAuth(), email)
}

export interface RegisterStudentInput {
  email: string
  password: string
  displayName: string
  phoneNumber?: string
  address?: string
  courseId: string
  displayLanguage: DisplayLanguage
}

// 生徒のセルフサインアップ(SPEC §2.2)。承認待ち状態のプロフィールを作成する。
export async function registerStudent(input: RegisterStudentInput) {
  const credential = await createUserWithEmailAndPassword(
    requireAuth(),
    input.email,
    input.password,
  )

  const profile: Omit<StudentProfile, 'createdAt'> & { createdAt: unknown } = {
    uid: credential.user.uid,
    email: input.email,
    displayName: input.displayName,
    role: 'student',
    displayLanguage: input.displayLanguage,
    approvalStatus: 'pending',
    phoneNumber: input.phoneNumber,
    address: input.address,
    courseId: input.courseId,
    level: null,
    placementTestCompleted: false,
    evaluationDialect: 'northern',
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(requireDb(), 'users', credential.user.uid), profile)
}

export interface CreateStaffAccountInput {
  email: string
  temporaryPassword: string
  displayName: string
  displayLanguage: DisplayLanguage
}

// 既存staffが管理画面から新規staffアカウントを発行する(SPEC §2.3)。
// セカンダリAppを使い、実行者(既存staff)のログインセッションを維持したまま作成する。
export async function createStaffAccount(input: CreateStaffAccountInput) {
  const secondaryApp = createSecondaryFirebaseApp()
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email,
      input.temporaryPassword,
    )

    const profile: Omit<StaffProfile, 'createdAt'> & { createdAt: unknown } = {
      uid: credential.user.uid,
      email: input.email,
      displayName: input.displayName,
      role: 'staff',
      displayLanguage: input.displayLanguage,
      createdAt: serverTimestamp(),
    }

    await setDoc(doc(requireDb(), 'users', credential.user.uid), profile)
    await signOut(secondaryAuth)
  } finally {
    await deleteApp(secondaryApp)
  }
}
