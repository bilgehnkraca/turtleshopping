import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'
import { useAuth } from '../hooks/useAuth'
import { cities } from '../data/cities'

export default function Home() {
  const { user, signOut } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchListings()
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
  }, [search, selectedCategory, selectedCity])

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(username, city), categories(name, icon)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (search) query = query.ilike('title', `%${search}%`)
    if (selectedCategory) query = query.eq('category_id', selectedCategory)
    if (selectedCity) query = query.eq('city', selectedCity)

    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐢</span>
            <span className="text-xl font-bold text-gray-800">TurtleShopping</span>
          </Link>
          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <Link to="/messages" className="text-gray-500 hover:text-gray-800 text-sm font-medium transition flex items-center gap-1">
                  💬 Mesajlar
                </Link>
                <Link to="/create-listing">
                  <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition shadow-sm">
                    + İlan Ver
                  </button>
                </Link>
                <button onClick={signOut} className="text-gray-400 text-sm hover:text-gray-700 transition">
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 text-sm font-medium hover:text-gray-900 transition">
                  Giriş Yap
                </Link>
                <Link to="/register">
                  <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition shadow-sm">
                    Kayıt Ol
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      {!search && !selectedCategory && !selectedCity && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h1 className="text-4xl font-bold mb-3">Güvenle Al, Güvenle Sat</h1>
            <p className="text-emerald-100 text-lg mb-8">Türkiye'nin en güvenilir 2. el pazarı</p>
            <div className="max-w-2xl mx-auto flex gap-3">
              <input
                placeholder="Ne arıyorsun?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-5 py-4 rounded-2xl text-gray-800 text-sm focus:outline-none shadow-lg"
              />
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="appearance-none px-5 py-4 pr-10 rounded-2xl text-gray-700 text-sm focus:outline-none shadow-lg bg-white font-medium min-w-44 cursor-pointer">
                  <option value="">📍 Tüm Şehirler</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Arama aktifse filtre barı göster */}
        {(search || selectedCategory || selectedCity) && (
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              placeholder="İlan ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="">Tüm Kategoriler</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
              <option value="">Tüm Şehirler</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedCity('') }}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:text-gray-800 transition">
              Temizle ✕
            </button>
          </div>
        )}

        {/* Kategoriler */}
        {categories.length > 0 && !search && !selectedCity && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Kategoriler</h2>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(prev => prev === String(c.id) ? '' : String(c.id))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition ${
                    selectedCategory === String(c.id)
                      ? 'border-emerald-400 bg-emerald-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-emerald-300 shadow-sm hover:shadow-md'
                  }`}>
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seçili kategori başlığı */}
        {selectedCategory && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-700 font-semibold text-lg">
              {categories.find(c => String(c.id) === selectedCategory)?.icon}{' '}
              {categories.find(c => String(c.id) === selectedCategory)?.name}
            </span>
            <button onClick={() => setSelectedCategory('')}
              className="text-xs text-gray-400 hover:text-gray-600 underline ml-2">
              Temizle
            </button>
          </div>
        )}

        {/* Son ilanlar başlığı */}
        {!selectedCategory && !search && !selectedCity && (
          <h2 className="text-lg font-bold text-gray-700 mb-4">Son İlanlar</h2>
        )}

        {/* İlanlar */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <Link to={`/listing/${listing.id}`} key={listing.id} className="group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition duration-200">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-2">
                      <span className="text-5xl">{(listing.categories as any)?.icon || '📦'}</span>
                      <span className="text-xs text-emerald-600 font-medium">{(listing.categories as any)?.name || 'Diğer'}</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{listing.title}</h3>
                    <p className="text-emerald-600 font-bold mt-1 text-base">{listing.price.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {(listing.categories as any)?.icon} {(listing.categories as any)?.name} · {(listing.profiles as any)?.city || 'Türkiye'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐢</span>
            <span className="font-semibold text-gray-600">TurtleShopping</span>
          </div>
          <p>© 2026 TurtleShopping. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}