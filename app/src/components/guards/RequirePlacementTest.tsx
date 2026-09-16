import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

// 承認済みだがプレースメントテスト未受験の生徒を、テストページへ誘導する(SPEC §2.2 手順4〜5)。
// テストページ自体はループを避けるため対象外にする。
export function RequirePlacementTest() {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  const isPlacementTestPage = location.pathname === '/learning/placement-test'
  if (
    profile?.role === 'student' &&
    !profile.placementTestCompleted &&
    !isPlacementTestPage
  ) {
    return <Navigate to="/learning/placement-test" replace />
  }

  return <Outlet />
}
