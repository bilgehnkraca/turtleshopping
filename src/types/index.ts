export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  phone?: string
  phone_verified?: boolean
  city?: string
  expo_push_token?: string
  rating: number
  review_count: number
  created_at: string
  role?: string
  iban?: string
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
  status: 'active' | 'sold' | 'deleted' | 'reserved' | 'pending'
  city?: string
  district?: string
  neighborhood?: string
  images?: string[]
  view_count: number
  is_tradeable?: boolean
  is_bargainable?: boolean
  is_guaranteed?: boolean
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

export interface UserReview {
  id: string
  reviewer_id: string
  target_user_id: string
  listing_id?: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: Profile
}

export interface AppNotification {
  id: string
  user_id: string
  listing_id?: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listings?: Listing
}

export interface Offer {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  sender_id: string
  amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
  updated_at: string
  listings?: Listing
  profiles?: Profile
}

export interface CategoryAttribute {
  id: string
  category_id: number
  name: string
  type: 'select' | 'number' | 'text' | 'boolean'
  is_required: boolean
  order: number
}

export interface AttributeValue {
  id: string
  attribute_id: string
  value: string
  parent_value_id?: string
  order: number
}

export interface ListingAttribute {
  listing_id: string
  attribute_id: string
  value_id?: string
  custom_value?: string
  category_attributes?: CategoryAttribute
  attribute_values?: AttributeValue
}