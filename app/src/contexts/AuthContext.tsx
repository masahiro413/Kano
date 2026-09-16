import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState, type ReactNode } from 'react'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import type { StaffProfile, StudentProfile } from '../types/firestore'
import { AuthContext, type Profile } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  // isFirebaseConfigured===falseの場合(App.tsx側でFirebaseSetupNoticeに差し替わり
  // AuthProviderはそもそも描画されない)を除き、通常は認証状態確定までtrue。
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) return

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user)
        if (!user) {
          setProfile(null)
          setLoading(false)
        }
      },
      (error) => {
        console.error('Auth state error:', error)
        setFirebaseUser(null)
        setProfile(null)
        setLoading(false)
      },
    )
    return unsubscribeAuth
  }, [])

  useEffect(() => {
    if (!firebaseUser || !db) return

    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snapshot) => {
        setProfile(
          snapshot.exists() ? (snapshot.data() as StudentProfile | StaffProfile) : null,
        )
        setLoading(false)
      },
    )
    return unsubscribeProfile
  }, [firebaseUser])

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
