import { createContext, useContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { StaffProfile, StudentProfile } from '../types/firestore'

export type Profile = StudentProfile | StaffProfile

export interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  profile: Profile | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}
