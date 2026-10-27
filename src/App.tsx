import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import SettingsPage from './pages/Settings'
import Dashboard from './pages/Dashboard'
import TaskListPage from './pages/TaskListPage'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import CalendarPage from './pages/CalendarPage'
import Focus from './pages/Focus'
import Stats from './pages/Stats'
import Trash from './pages/Trash'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './context/ToastContext'
import { DashboardSkeleton, Skeleton } from './components/Skeleton'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen p-6 md:p-12 flex gap-8 max-w-6xl mx-auto">
        <div className="hidden md:block w-60 space-y-4">
          <Skeleton className="h-8 w-32 rounded-xl mb-6" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex-1">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="inbox" element={<TaskListPage kind="inbox" />} />
        <Route path="today" element={<TaskListPage kind="today" />} />
        <Route path="upcoming" element={<TaskListPage kind="upcoming" />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="focus" element={<Focus />} />
        <Route path="stats" element={<Stats />} />
        <Route path="archive" element={<TaskListPage kind="archive" />} />
        <Route path="trash" element={<Trash />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
