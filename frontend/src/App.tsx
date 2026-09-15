import { lazy, Suspense } from 'react'
import { Route, Routes, Navigate, useLocation, Outlet } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/States'
import { Home } from './pages/Home'
import { QuestionsList } from './pages/QuestionsList'
import { QuestionDetail } from './pages/QuestionDetail'
import { Ask } from './pages/Ask'
import { NotFound } from './pages/Static'
import { useAuth } from './context/AuthContext'

// Secondary routes are code-split to keep the initial bundle small.
const Categories = lazy(() => import('./pages/Categories').then((m) => ({ default: m.Categories })))
const CategoryDetail = lazy(() => import('./pages/CategoryDetail').then((m) => ({ default: m.CategoryDetail })))
const Tags = lazy(() => import('./pages/Tags').then((m) => ({ default: m.Tags })))
const TagDetail = lazy(() => import('./pages/Tags').then((m) => ({ default: m.TagDetail })))
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })))
const UserProfile = lazy(() => import('./pages/UserProfile').then((m) => ({ default: m.UserProfile })))
const Leaderboard = lazy(() => import('./pages/Leaderboard').then((m) => ({ default: m.Leaderboard })))

const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })))
const ForgotPassword = lazy(() => import('./pages/Auth').then((m) => ({ default: m.ForgotPassword })))

const Notifications = lazy(() => import('./pages/UserPages').then((m) => ({ default: m.Notifications })))
const Bookmarks = lazy(() => import('./pages/UserPages').then((m) => ({ default: m.Bookmarks })))
const Settings = lazy(() => import('./pages/UserPages').then((m) => ({ default: m.Settings })))

const CommunityGuidelines = lazy(() => import('./pages/Static').then((m) => ({ default: m.CommunityGuidelines })))
const About = lazy(() => import('./pages/Static').then((m) => ({ default: m.About })))

// Admin routes - each page is now separate
const AdminLayout = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminDashboard })))
const AdminReports = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminReports })))
const AdminContent = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminContent })))
const AdminUsers = lazy(() => import('./pages/Admin').then((m) => ({ default: m.AdminUsers })))
const AdminCategories = lazy(() => import('./pages/AdminMore').then((m) => ({ default: m.AdminCategories })))
const AdminTags = lazy(() => import('./pages/AdminMore').then((m) => ({ default: m.AdminTags })))
const AdminBadges = lazy(() => import('./pages/AdminMore').then((m) => ({ default: m.AdminBadges })))
const AdminReputation = lazy(() => import('./pages/AdminMore').then((m) => ({ default: m.AdminReputation })))
const AdminSettings = lazy(() => import('./pages/AdminMore').then((m) => ({ default: m.AdminSettings })))

// Auth guard for login/register pages - redirects authenticated users to home
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spinner />
  }

  if (user) {
    // Redirect to the intended destination or home
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

// Wrapper for public auth pages (login, register, forgot-password)
function PublicAuthPage({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Suspense fallback={<Spinner />}>
        {children}
      </Suspense>
    </AuthGuard>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/questions" element={<QuestionsList />} />
        <Route path="/questions/unanswered" element={<QuestionsList unansweredOnly />} />
        <Route path="/questions/:slug" element={<QuestionDetail />} />
        <Route path="/ask" element={<Ask />} />

        <Route path="/categories" element={<Suspense fallback={<Spinner />}><Categories /></Suspense>} />
        <Route path="/categories/:slug" element={<Suspense fallback={<Spinner />}><CategoryDetail /></Suspense>} />
        <Route path="/tags" element={<Suspense fallback={<Spinner />}><Tags /></Suspense>} />
        <Route path="/tags/:slug" element={<Suspense fallback={<Spinner />}><TagDetail /></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<Spinner />}><Search /></Suspense>} />
        <Route path="/users/:username" element={<Suspense fallback={<Spinner />}><UserProfile /></Suspense>} />
        <Route path="/leaderboard" element={<Suspense fallback={<Spinner />}><Leaderboard /></Suspense>} />

        {/* Public auth routes - only accessible when not authenticated */}
        <Route element={<PublicAuthPage />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route path="/notifications" element={<Suspense fallback={<Spinner />}><Notifications /></Suspense>} />
        <Route path="/bookmarks" element={<Suspense fallback={<Spinner />}><Bookmarks /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<Spinner />}><Settings /></Suspense>} />

        <Route path="/community-guidelines" element={<Suspense fallback={<Spinner />}><CommunityGuidelines /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<Spinner />}><About /></Suspense>} />

        <Route path="/admin" element={<Suspense fallback={<Spinner />}><AdminLayout /></Suspense>}>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="questions" element={<AdminContent kind="questions" />} />
          <Route path="answers" element={<AdminContent kind="answers" />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="tags" element={<AdminTags />} />
          <Route path="badges" element={<AdminBadges />} />
          <Route path="reputation" element={<AdminReputation />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}