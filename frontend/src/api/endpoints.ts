import { api } from './client'
import type {
  Answer, AppNotification, Badge, Category, Comment, CurrentUser, LeaderboardPerson, Paginated, Question, Tag, UserSummary,
} from '../types'

// ---------------------------------------------------------------- Auth

export const authApi = {
  register: (payload: { name: string; username: string; email: string; password: string }) =>
    api.post<{ data: UserSummary }>('/auth/register', payload).then((r) => r.data),
  login: (payload: { email: string; password: string }) =>
    api.post<{ data: UserSummary }>('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get<{ data: CurrentUser }>('/auth/me').then((r) => r.data.data),
  sendVerification: () => api.post('/auth/email/verification-notification').then((r) => r.data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (payload: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/reset-password', payload).then((r) => r.data),
}

// ------------------------------------------------------------- Questions

export interface QuestionQuery {
  page?: number
  per_page?: number
  sort?: string
  category?: string
  tag?: string
  author?: string
  unanswered?: boolean
}

export const questionsApi = {
  list: (params: QuestionQuery = {}) => api.get<Paginated<Question>>('/questions', { params }).then((r) => r.data),
  show: (slug: string) => api.get<{ data: Question }>(`/questions/${slug}`).then((r) => r.data.data),
  create: (payload: { title: string; body: string; category_id: number; tags?: string[]; status?: string }) =>
    api.post<{ data: Question }>('/questions', payload).then((r) => r.data.data),
  update: (id: number, payload: { title?: string; body?: string; category_id?: number; tags?: string[] }) =>
    api.put<{ data: Question }>(`/questions/${id}`, payload).then((r) => r.data.data),
  destroy: (id: number) => api.delete(`/questions/${id}`).then((r) => r.data),
  answers: (id: number, sort = 'votes') =>
    api.get<{ data: Answer[] }>(`/questions/${id}/answers`, { params: { sort } }).then((r) => r.data.data),
  answer: (id: number, body: string) =>
    api.post<{ data: Answer }>(`/questions/${id}/answers`, { body }).then((r) => r.data.data),
  bookmark: (id: number) => api.post<{ data: { bookmarked: boolean } }>(`/questions/${id}/bookmark`).then((r) => r.data.data),
  follow: (id: number) => api.post<{ data: { following: boolean } }>(`/questions/${id}/follow`).then((r) => r.data.data),
}

// --------------------------------------------------------------- Answers

export const answersApi = {
  update: (id: number, body: string) => api.put<{ data: Answer }>(`/answers/${id}`, { body }).then((r) => r.data.data),
  destroy: (id: number) => api.delete(`/answers/${id}`).then((r) => r.data),
  accept: (id: number) => api.post(`/answers/${id}/accept`).then((r) => r.data),
  unaccept: (id: number) => api.post(`/answers/${id}/unaccept`).then((r) => r.data),
}

// --------------------------------------------------------------- Votes

export const votesApi = {
  store: (votableType: 'question' | 'answer', votableId: number, value: 1 | -1) =>
    api.post<{ data: { my_vote: number; votes_score: number } }>('/votes', {
      votable_type: votableType, votable_id: votableId, value,
    }).then((r) => r.data),
}

// -------------------------------------------------------------- Comments

export const commentsApi = {
  list: (commentableType: 'question' | 'answer', commentableId: number) =>
    api.get<{ data: Comment[] }>('/comments', {
      params: { commentable_type: commentableType, commentable_id: commentableId },
    }).then((r) => r.data.data),
  store: (commentableType: 'question' | 'answer', commentableId: number, body: string) =>
    api.post<{ data: Comment }>('/comments', {
      commentable_type: commentableType, commentable_id: commentableId, body,
    }).then((r) => r.data.data),
  destroy: (id: number) => api.delete(`/comments/${id}`).then((r) => r.data),
}

// ------------------------------------------------------- Categories/tags

export const categoriesApi = {
  list: () => api.get<{ data: Category[] }>('/categories').then((r) => r.data.data),
  show: (slug: string, params: { page?: number; sort?: string } = {}) =>
    api.get<{
      data: {
        category: Category
        stats: { total: number; unanswered: number; solved: number }
        related_tags: Tag[]
        questions: { data: Question[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }
      }
    }>(`/categories/${slug}`, { params }).then((r) => r.data.data),
}

export const tagsApi = {
  list: (params: { page?: number; per_page?: number; q?: string } = {}) =>
    api.get<Paginated<Tag>>('/tags', { params }).then((r) => r.data),
  show: (slug: string, params: { page?: number; sort?: string } = {}) =>
    api.get<{
      data: { tag: Tag; questions: { data: Question[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } }
    }>(`/tags/${slug}`, { params }).then((r) => r.data.data),
  suggest: (q: string) => api.get<{ data: Tag[] }>('/tags/suggest', { params: { q } }).then((r) => r.data.data),
}

// --------------------------------------------------------------- Search

export const searchApi = {
  query: (params: { q: string; page?: number; sort?: string; category_id?: number }) =>
    api.get<{
      data: { query: string; data: Question[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }
    }>('/search', { params }).then((r) => r.data.data),
}

// ----------------------------------------------------------------- Users

export const usersApi = {
  show: (username: string) =>
    api.get<{
      data: CurrentUser & { badges: Badge[]; member_since: string; verification: string | null }
    }>(`/users/${username}`).then((r) => r.data.data),
  questions: (username: string, params: { page?: number } = {}) =>
    api.get<Paginated<Question>>(`/users/${username}/questions`, { params }).then((r) => r.data),
  answers: (username: string, params: { page?: number } = {}) =>
    api.get<Paginated<Answer & { question: { slug: string; title: string; is_solved: boolean } }>>(`/users/${username}/answers`, { params }).then((r) => r.data),
}

// ------------------------------------------------------------ Leaderboard

export const leaderboardApi = {
  index: (month?: string) =>
    api.get<{
      data: {
        period: { period_key: string; start_date: string; end_date: string; is_current?: boolean }
        contributors: LeaderboardPerson[]
        askers: LeaderboardPerson[]
        answerers: LeaderboardPerson[]
        all_time?: { contributors: LeaderboardPerson[] }
        archive?: { id: number; period_key: string }[]
      }
    }>('/leaderboard', { params: month ? { month } : {} }).then((r) => r.data.data),
}

// ---------------------------------------------------------- Notifications

export const notificationsApi = {
  list: (params: { page?: number } = {}) =>
    api.get<{ data: { data: AppNotification[]; meta: { current_page: number; last_page: number; total: number }; unread_count: number } }>('/notifications', { params }).then((r) => r.data.data),
  unreadCount: () => api.get<{ data: { unread_count: number } }>('/notifications/unread-count').then((r) => r.data.data.unread_count),
  markRead: (id: string) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
}

// --------------------------------------------------------------- Reports

export const reportsApi = {
  create: (payload: { reportable_type: string; reportable_id: number; reason: string; description?: string }) =>
    api.post('/reports', payload).then((r) => r.data),
}

// ----------------------------------------------------------------- Media

export const mediaApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return api.post<{ data: { id: number; url: string } }>('/media', form).then((r) => r.data.data)
  },
}

// ------------------------------------------------------------ Bookmarks

export const bookmarksApi = {
  list: (params: { page?: number } = {}) =>
    api.get<Paginated<Question>>('/me/bookmarks', { params }).then((r) => r.data),
}

// ----------------------------------------------------------------- Badges

export const badgesApi = {
  list: () => api.get<{ data: Badge[] }>('/badges').then((r) => r.data.data),
}
