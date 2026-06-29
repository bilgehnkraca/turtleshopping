import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'

export default function Favorites() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login')
        return
      }
      setCurrentUser(data.user.id)
      fetchFavorites(data.user.id)
    })
  }, [navigate])

  async function fetchFavorites(userId: string) {
    // favorites tablosu ve içindeki listing bilgileri (foreign key ile çekilecek)
    const { data, error } = await supabase
      .from('favorites')
      .select('*, listings(*, categories(name, icon), profiles!listings_user_id_fkey(city))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('Favorites data:', data, error)
    setFavorites(data || [])
    setLoading(false)
  }

  async function removeFavorite(listingId: string) {
    if (!currentUser) return
    await supabase.from('favorites').delete().eq('user_id', currentUser).eq('listing_id', listingId)
    setFavorites(prev => prev.filter(f => f.listing_id !== listingId))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl">❤️</span>
            <h1 className="text-2xl font-black text-gray-800">Favorilerim <span className="text-gray-400 text-lg font-normal">({favorites.length})</span></h1>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl opacity-80">🤍</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Henüz Favori İlanın Yok</h2>
            <p className="text-gray-500 max-w-sm mb-8">İlgilendiğin ilanları favorilere ekleyerek fiyat düşüşlerinden anında haberdar olabilirsin.</p>
            <Link to="/" className="btn-primary px-8 py-3 bg-[#044c34] hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1">
              İlanları Keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map(fav => {
              const listing = fav.listings
              if (!listing) return null
              
              const isInactive = listing.status !== 'active' || listing.suspended
              
              return (
                <div key={fav.id} className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col h-full relative ${isInactive ? 'opacity-70 grayscale' : ''}`}>
                  <Link to={`/listing/${listing.id}`} className="flex-1 flex flex-col">
                    <div className="relative">
                        {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title}
                            className="w-full h-44 object-cover" />
                        ) : (
                        <div className="w-full h-44 bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-2">
                            <span className="text-5xl">{listing.categories?.icon || '📦'}</span>
                        </div>
                        )}
                        {isInactive && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">İlan Aktif Değil</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{listing.title}</h3>
                      <p className="text-emerald-600 font-bold mt-1 text-base">{listing.price?.toLocaleString('tr-TR')} ₺</p>
                      
                      <div className="flex-1"></div>
                      
                      <p className="text-xs text-gray-400 mt-2 truncate">
                        {listing.categories?.icon} {listing.categories?.name} · {listing.profiles?.city || 'Türkiye'}
                      </p>
                    </div>
                  </Link>

                  <div className="px-3 pb-3">
                    <button onClick={(e) => { e.preventDefault(); removeFavorite(listing.id) }}
                        className="w-full py-2 bg-red-50 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-1 border border-red-100">
                        <span>🗑️</span> Favorilerden Çıkar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
