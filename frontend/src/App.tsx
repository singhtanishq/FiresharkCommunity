import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/States'
import { Home } from './pages/Home'
import { QuestionsList } from './pages/QuestionsList'
import { QuestionDetail } from './pages/QuestionDetail'
import { Ask } from './pages/Ask'
import { NotFound } from './pages/Static'

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
const ResetPassword = lazy(() => import('./pages/Auth').then((m) => ({ default: m.ResetPassword })))
const VerifyEmail = lazy(() => import('./pages/Auth').then((m) => ({ default: m.VerifyEmail })))

const Notifications = lazy(() => import('./pages/UserPages').then((m) => ({ default: m.Notifications })))
const Bookmarks = lazy(() => import('./pages/UserPages').then((m) => ({ default: m.Bookmarks })))
const Settings = lazy(() => import('./pages/UserPages').then((m) => ({ default: m.Settings })))

const CommunityGuidelines = lazy(() => import('./pages/Static').then((m) => ({ default: m.CommunityGuidelines })))
const About = lazy(() => import('./pages/Static').then((m) => ({ default: m.About })))

const AdminLayout = lazy(() => import('./pages/Admin.tsx').then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('./pages/Admin.tsx').then((m) => ({ default: m.AdminDashboard })))
const AdminReports = lazy(() => import('./pages/Admin.tsx').then((m) => ({ default: m.AdminReports })))
const AdminContent = lazy(() => import('./pages/Admin.tsx').then((m) => ({ default: m.AdminContent })))
const AdminUsers = lazy(() => import('./pages/Admin.tsx').then((m) => ({ default: m.AdminUsers })))
const AdminTaxonomy = lazy(() => import('./pages/AdminMore.tsx').then((m) => ({ default: m.AdminTaxonomy })))
const AdminGamification = lazy(() => import('./pages/AdminMore.tsx').then((m) => ({ default: m.AdminGamification })))
const AdminSettings = lazy(() => import('./pages/AdminMore.tsx').then((m) => ({ default: m.AdminSettings })))

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

        <Route path="/login" element={<Suspense fallback={<Spinner />}><Login /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<Spinner />}><Register /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<Spinner />}><ForgotPassword /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<Spinner />}><ResetPassword /></Suspense>} />
        <Route path="/verify-email" element={<Suspense fallback={<Spinner />}><VerifyEmail /></Suspense>} />

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
          <Route path="categories" element={<AdminTaxonomy />} />
          <Route path="badges" element={<AdminGamification />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
