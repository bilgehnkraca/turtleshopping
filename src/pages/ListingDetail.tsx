import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'

const conditionLabels: Record<string, string> = {
  new: 'Sıfır',
  like_new: 'Sıfır Gibi',
  good: 'İyi',
  fair: 'Makul',
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    fetchListing()
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id || null
      setCurrentUser(userId)
      if (userId) checkFavorite(userId)
    })
  }, [id])

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(username, city, full_name), categories(name, icon)')
      .eq('id', id)
      .single()
    setListing(data)
    setLoading(false)

    if (data) {
      await supabase.from('listings').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
    }
  }

  async function checkFavorite(userId: string) {
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', id)
      .maybeSingle()
    setIsFavorited(!!data)
  }

  async function toggleFavorite() {
    if (!currentUser) { navigate('/login'); return }
    if (isFavorited) {
      await supabase.from('favorites').delete()
        .eq('user_id', currentUser).eq('listing_id', id)
      setIsFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: currentUser, listing_id: id })
      setIsFavorited(true)
    }
  }

  async function handleContact() {
    if (!currentUser) { navigate('/login'); return }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', id)
      .eq('buyer_id', currentUser)
      .maybeSingle()

    if (existing) {
      navigate(`/conversation/${existing.id}`)
      return
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        listing_id: id,
        buyer_id: currentUser,
        seller_id: listing?.user_id,
      })
      .select()
      .single()

    if (conv) navigate(`/conversation/${conv.id}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">İlan bulunamadı.</p>
    </div>
  )

  const profile = listing.profiles as any
  const category = listing.categories as any
  const isOwner = currentUser === listing.user_id

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/" className="text-2xl font-bold text-blue-600">🐢 TurtleShopping</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="text-blue-600 text-sm hover:underline">← Ana Sayfa</Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img src={listing.images[0]} alt={listing.title}
              className="w-full max-h-96 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-6xl">📦</div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{listing.title}</h1>
              <button onClick={toggleFavorite}
                className={`text-2xl transition ${isFavorited ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
                {isFavorited ? '❤️' : '🤍'}
              </button>
            </div>

            <p className="text-3xl font-bold text-blue-600 mb-4">{listing.price.toLocaleString('tr-TR')} ₺</p>

            <div className="flex gap-2 mb-4">
              <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                {conditionLabels[listing.condition]}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                {category?.icon} {category?.name}
              </span>
              {listing.city && (
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                  📍 {listing.city}
                </span>
              )}
            </div>

            {listing.description && (
              <p className="text-gray-600 leading-relaxed mb-6">{listing.description}</p>
            )}

            <p className="text-xs text-gray-400 mb-6">{listing.view_count} görüntülenme</p>

            <Link to={`/profile/${listing.user_id}`}>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6 hover:bg-gray-100 transition cursor-pointer">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {(profile?.full_name || profile?.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{profile?.full_name || profile?.username}</p>
                  {profile?.city && <p className="text-xs text-gray-500">📍 {profile.city}</p>}
                </div>
                <span className="ml-auto text-blue-600 text-sm">→</span>
              </div>
            </Link>

            {!isOwner && (
              <button onClick={handleContact}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition text-sm">
                Satıcıyla İletişime Geç
              </button>
            )}

            {isOwner && (
              <p className="text-center text-sm text-gray-400">Bu ilan size ait.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}