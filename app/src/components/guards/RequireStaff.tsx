import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

// staff専用エリアを保護するガード。講師と管理者は権限上区別しない(SPEC §1)。
export function RequireStaff() {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (profile?.role !== 'staff') return <Navigate to="/" replace />

  return <Outlet />
}
