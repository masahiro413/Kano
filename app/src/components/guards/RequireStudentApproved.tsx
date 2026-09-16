import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

// 生徒が承認待ち状態の間は、承認待ち画面以外へのアクセスを許可しない(SPEC §2.2)。
export function RequireStudentApproved() {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (profile?.role === 'student' && profile.approvalStatus !== 'approved') {
    return <Navigate to="/pending-approval" replace />
  }

  return <Outlet />
}
