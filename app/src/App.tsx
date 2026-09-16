import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/guards/RequireAuth'
import { RequireStaff } from './components/guards/RequireStaff'
import { RequireStudentApproved } from './components/guards/RequireStudentApproved'
import { FirebaseSetupNotice } from './components/FirebaseSetupNotice'
import { AuthProvider } from './contexts/AuthContext'
import { isFirebaseConfigured } from './lib/firebase'
import { LoginPage } from './pages/auth/LoginPage'
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ApprovalQueuePage } from './pages/staff/ApprovalQueuePage'
import { ContentManagementPage } from './pages/staff/ContentManagementPage'
import { LearningHomePage } from './pages/student/LearningHomePage'
import { PlacementTestPage } from './pages/student/PlacementTestPage'
import { TasksPage } from './pages/tasks/TasksPage'

function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupNotice />
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/pending-approval" element={<PendingApprovalPage />} />

            <Route element={<RequireStudentApproved />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/learning" element={<LearningHomePage />} />
                <Route path="/learning/placement-test" element={<PlacementTestPage />} />

                <Route element={<RequireStaff />}>
                  <Route path="/staff/approvals" element={<ApprovalQueuePage />} />
                  <Route path="/staff/content" element={<ContentManagementPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
