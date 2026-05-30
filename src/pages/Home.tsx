import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { user, signOut } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchListings()
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
  }, [search, selectedCategory])

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(username, city), categories(name, icon)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (search) query = query.ilike('title', `%${search}%`)
    if (selectedCategory) query = query.eq('category_id', selectedCategory)

    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">🐢 TurtleShopping</Link>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <Link to="/create-listing">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    + İlan Ver
                  </button>
                  <Link to="/messages">
  <button className="text-gray-600 text-sm font-medium hover:text-gray-900 transition">
    💬 Mesajlar
  </button>
</Link>
                </Link>
                <button onClick={signOut} className="text-gray-600 text-sm hover:text-gray-900 transition">
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="text-gray-600 text-sm font-medium hover:text-gray-900 transition">Giriş Yap</button>
                </Link>
                <Link to="/register">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    Kayıt Ol
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Arama ve Filtre */}
        <div className="flex gap-3 mb-8">
          <input
            placeholder="İlan ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">Tüm Kategoriler</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* İlanlar */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Henüz ilan yok.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <Link to={`/listing/${listing.id}`} key={listing.id} className="group">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">📦</div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm truncate">{listing.title}</h3>
                    <p className="text-blue-600 font-bold mt-1">{listing.price.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(listing.categories as any)?.icon} {(listing.categories as any)?.name} · {(listing.profiles as any)?.city || 'Türkiye'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}