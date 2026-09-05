import axios from 'axios'

/**
 * Same-origin API client. In development the Vite proxy forwards /api to
 * Laravel; in production the SPA is served by Laravel itself. Session
 * cookies + CSRF therefore always work first-party.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Laravel's CSRF cookie is set on any stateful API response. Ensure it
// exists before the first mutating request of the session.
let csrfReady: Promise<void> | null = null

async function ensureCsrfCookie(): Promise<void> {
  if (document.cookie.includes('XSRF-TOKEN=')) return
  if (!csrfReady) {
    csrfReady = api.get('/categories', { withCredentials: true }).then(() => undefined)
    await csrfReady
    csrfReady = null
  }
}

api.interceptors.request.use(async (config) => {
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    await ensureCsrfCookie()
  }
  return config
})

// Consistent error surface for components.
export function apiError(error: unknown): { message: string; errors: Record<string, string[]> | null; status?: number } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    return {
      message: data?.message ?? error.message ?? 'Something went wrong.',
      errors: data?.errors ?? null,
      status: error.response?.status,
    }
  }
  return { message: 'Something went wrong.', errors: null }
}

/** Cached total from a paginated response */
export type Paged<T> = { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }
