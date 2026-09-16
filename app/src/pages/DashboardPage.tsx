import { useAuth } from '../contexts/authContext'
import { StaffDashboardPage } from './staff/StaffDashboardPage'
import { StudentDashboardPage } from './student/StudentDashboardPage'

// "/" はロールに応じて生徒用・staff用のホームを出し分ける。
export function DashboardPage() {
  const { profile } = useAuth()
  return profile?.role === 'staff' ? <StaffDashboardPage /> : <StudentDashboardPage />
}
