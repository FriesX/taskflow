import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './context/ToastContext'
import { DashboardSkeleton, Skeleton } from './components/Skeleton'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Layout = lazy(() => import('./components/Layout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const TaskListPage = lazy(() => import('./pages/TaskListPage'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const Focus = lazy(() => import('./pages/Focus'))
const Stats = lazy(() => import('./pages/Stats'))
const Trash = lazy(() => import('./pages/Trash'))
const SettingsPage = lazy(() => import('./pages/Settings'))

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] p-6 md:p-10 flex gap-8 max-w-6xl mx-auto">
      <div className="hidden md:block w-56 space-y-3">
        <Skeleton className="h-7 w-28 mb-6" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="flex-1">
        <DashboardSkeleton />
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <AppShellSkeleton />
  }

  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

        {user ? (
          <Route element={<Layout />}>
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
        ) : (
          <Route path="/" element={<Landing />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
