// API resource types mirroring the Laravel responses.

export type Role = 'user' | 'moderator' | 'admin'

export interface UserSummary {
  id: number
  name: string
  username: string
  avatar_path: string | null
  role: Role
  reputation: number
  verification?: string | null
}

export interface CurrentUser extends UserSummary {
  email: string
  email_verified: boolean
  bio: string | null
  expertise: string | null
  location: string | null
  website: string | null
  questions_count: number
  answers_count: number
  accepted_answers_count: number
  badges_count: number
  notification_preferences: Record<string, boolean> | null
  created_at: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  description?: string | null
  questions_count: number
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
  questions_count: number
  is_active: boolean
}

export interface Question {
  id: number
  title: string
  slug: string
  url: string
  body?: string
  excerpt?: string
  status: string
  is_solved: boolean
  closed_reason: string | null
  views: number
  votes_score: number
  answers_count: number
  accepted_answer_id: number | null
  created_at: string
  updated_at: string
  last_activity_at: string | null
  user: UserSummary
  category: Category
  tags: Tag[]
  my_vote?: number
  bookmarked?: boolean
  following?: boolean
}

export interface Comment {
  id: number
  body: string
  commentable_type: string
  commentable_id: number
  created_at: string
  updated_at: string
  user: UserSummary
}

export interface Answer {
  id: number
  question_id: number
  body: string
  status: string
  votes_score: number
  accepted: boolean
  accepted_at: string | null
  created_at: string
  updated_at: string
  user: UserSummary
  comments?: Comment[]
  my_vote?: number
}

export interface Badge {
  id: number
  name: string
  slug: string
  description: string
  icon: string | null
  tier: 'bronze' | 'silver' | 'gold'
  award_type: 'automatic' | 'manual'
  awarded_at?: string
}

export interface AppNotification {
  id: string
  type: string
  message: string
  url: string
  actor: { name: string; username: string } | null
  read_at: string | null
  created_at: string
}

export interface LeaderboardPerson {
  user_id?: number
  id?: number
  name: string
  username: string
  avatar_path: string | null
  all_time_reputation?: number
  reputation?: number
  score?: number
  questions_count?: number
  answers_count?: number
  accepted_answers_count?: number
}

export interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface Paginated<T> {
  success: boolean
  message: string
  data: T[]
  meta: PageMeta
}
