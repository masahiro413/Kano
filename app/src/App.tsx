import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { FirebaseSetupNotice } from './components/FirebaseSetupNotice'
import { RequireAuth } from './components/guards/RequireAuth'
import { RequirePlacementTest } from './components/guards/RequirePlacementTest'
import { RequireStaff } from './components/guards/RequireStaff'
import { RequireStudentApproved } from './components/guards/RequireStudentApproved'
import { AuthProvider } from './contexts/AuthContext'
import { isFirebaseConfigured } from './lib/firebase'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ApprovalQueuePage } from './pages/staff/ApprovalQueuePage'
import { ContentManagementPage } from './pages/staff/ContentManagementPage'
import { CoursesManagementPage } from './pages/staff/CoursesManagementPage'
import { CreateStaffAccountPage } from './pages/staff/CreateStaffAccountPage'
import { LevelSettingsPage } from './pages/staff/LevelSettingsPage'
import { ListeningMaterialsManagementPage } from './pages/staff/ListeningMaterialsManagementPage'
import { QuestionSetDetailPage } from './pages/staff/QuestionSetDetailPage'
import { QuestionSetsManagementPage } from './pages/staff/QuestionSetsManagementPage'
import { VocabCardsManagementPage } from './pages/staff/VocabCardsManagementPage'
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/pending-approval" element={<PendingApprovalPage />} />

            <Route element={<RequireStudentApproved />}>
              <Route element={<RequirePlacementTest />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/learning" element={<LearningHomePage />} />
                  <Route
                    path="/learning/placement-test"
                    element={<PlacementTestPage />}
                  />

                  <Route element={<RequireStaff />}>
                    <Route path="/staff/approvals" element={<ApprovalQueuePage />} />
                    <Route path="/staff/content" element={<ContentManagementPage />} />
                    <Route
                      path="/staff/content/courses"
                      element={<CoursesManagementPage />}
                    />
                    <Route
                      path="/staff/content/questions"
                      element={<QuestionSetsManagementPage />}
                    />
                    <Route
                      path="/staff/content/questions/:setId"
                      element={<QuestionSetDetailPage />}
                    />
                    <Route
                      path="/staff/content/vocab"
                      element={<VocabCardsManagementPage />}
                    />
                    <Route
                      path="/staff/content/listening"
                      element={<ListeningMaterialsManagementPage />}
                    />
                    <Route path="/staff/level-settings" element={<LevelSettingsPage />} />
                    <Route
                      path="/staff/create-account"
                      element={<CreateStaffAccountPage />}
                    />
                  </Route>
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
