import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

// ログイン必須のルートを保護するガード。未ログインなら/loginへリダイレクトする。
export function RequireAuth() {
  const { firebaseUser, loading } = useAuth()

  if (loading) return null
  if (!firebaseUser) return <Navigate to="/login" replace />

  return <Outlet />
}
