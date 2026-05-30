export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  phone?: string
  city?: string
  rating: number
  review_count: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  parent_id?: number
}

export interface Listing {
  id: string
  user_id: string
  category_id: number
  title: string
  description?: string
  price: number
  currency: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  status: 'active' | 'sold' | 'deleted'
  city?: string
  images?: string[]
  view_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
  categories?: Category
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  listings?: Listing
  profiles?: Profile
  messages?: Message[]
}