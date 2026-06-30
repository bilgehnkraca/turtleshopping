import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'
import { useAuth } from '../hooks/useAuth'
import { cities } from '../data/cities'
import { Navbar } from '../components/Navbar'

export default function Home() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [condition, setCondition] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchListings()
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
  }, [search, selectedCategory, selectedCity, minPrice, maxPrice, condition, sortBy, user])

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(username, city), categories(name, icon)')
      .eq('suspended', false)
      .eq('status', 'active')

    if (search) query = query.ilike('title', `%${search}%`)
    if (selectedCategory) {
      const subCategoryIds = categories.filter(c => c.parent_id === Number(selectedCategory)).map(c => c.id)
      const allIds = [Number(selectedCategory), ...subCategoryIds]
      query = query.in('category_id', allIds)
    }
    if (selectedCity) query = query.eq('city', selectedCity)
    if (minPrice) query = query.gte('price', minPrice)
    if (maxPrice) query = query.lte('price', maxPrice)
    if (condition) query = query.eq('condition', condition)

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
    if (sortBy === 'price_asc') query = query.order('price', { ascending: true })
    if (sortBy === 'price_desc') query = query.order('price', { ascending: false })

    query = query.limit(20)

    const { data } = await query
    setListings(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      {!search && !selectedCategory && !selectedCity && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h1 className="text-4xl font-bold mb-3">Güvenle Al, Güvenle Sat</h1>
            <p className="text-emerald-100 text-lg mb-8">Türkiye'nin en güvenilir 2. el pazarı</p>
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
              <input
                placeholder="Ne arıyorsun?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 w-full px-5 py-4 rounded-2xl text-gray-800 text-sm focus:outline-none shadow-lg"
              />
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="appearance-none w-full sm:min-w-44 px-5 py-4 pr-10 rounded-2xl text-gray-700 text-sm focus:outline-none shadow-lg bg-white font-medium cursor-pointer">
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

        {(search || selectedCategory || selectedCity || minPrice || maxPrice || condition || sortBy !== 'newest') && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  placeholder="Ne arıyorsun? (Örn: iPhone 13)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 text-gray-800 placeholder-gray-400 transition"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-5 py-3.5 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700 transition cursor-pointer min-w-[140px]">
                  <option value="">📁 Tüm Kategoriler</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="px-5 py-3.5 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700 transition cursor-pointer min-w-[140px]">
                  <option value="">📍 Tüm Şehirler</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4 border-t border-gray-50">
              <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 transition">
                  <input type="number" placeholder="Min ₺" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-transparent border-none focus:outline-none text-sm text-center font-medium text-gray-700 placeholder-gray-400" />
                  <span className="text-gray-300">-</span>
                  <input type="number" placeholder="Max ₺" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                      className="w-24 px-3 py-1.5 bg-transparent border-none focus:outline-none text-sm text-center font-medium text-gray-700 placeholder-gray-400" />
                </div>

                <select value={condition} onChange={e => setCondition(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 transition cursor-pointer">
                    <option value="">Tüm Durumlar</option>
                    <option value="new">Sıfır</option>
                    <option value="like_new">Yeni Gibi</option>
                    <option value="good">İyi Durumda</option>
                    <option value="fair">Makul</option>
                </select>

                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 transition cursor-pointer">
                    <option value="newest">En Yeni</option>
                    <option value="price_asc">En Ucuz</option>
                    <option value="price_desc">En Pahalı</option>
                </select>
              </div>

              <button onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedCity(''); setMinPrice(''); setMaxPrice(''); setCondition(''); setSortBy('newest') }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2.5 rounded-xl text-sm font-bold transition w-full md:w-auto">
                Aramayı Temizle ✕
              </button>
            </div>
          </div>
        )}

        {/* Kategoriler */}
        {categories.length > 0 && !search && !selectedCity && !minPrice && !maxPrice && !condition && sortBy === 'newest' && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Kategoriler</h2>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {categories.filter(c => !c.parent_id).map(c => (
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

            {/* Subcategories (if a parent is selected) */}
            {selectedCategory && categories.some(c => c.parent_id === Number(selectedCategory)) && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.parent_id === Number(selectedCategory)).map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedCategory(String(sub.id))}
                      className="px-4 py-2 bg-white rounded-full text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-sm">
                      {sub.icon} {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        {!selectedCategory && !search && !selectedCity && !minPrice && !maxPrice && !condition && sortBy === 'newest' && (
          <h2 className="text-lg font-bold text-gray-700 mb-4">Son İlanlar</h2>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                 <div className="w-full h-44 bg-gray-200"></div>
                 <div className="p-3">
                   <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                   <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                   <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                 </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(listing => (
              <Link to={`/listing/${listing.id}`} key={listing.id} className="group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition duration-200 flex flex-col h-full">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-2">
                      <span className="text-5xl">{(listing.categories as any)?.icon || '📦'}</span>
                      <span className="text-xs text-emerald-600 font-medium">{(listing.categories as any)?.name || 'Diğer'}</span>
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{listing.title}</h3>
                    <p className="text-emerald-600 font-bold mt-1 text-base">{listing.price.toLocaleString('tr-TR')} ₺</p>
                    <div className="flex-1"></div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {listing.is_guaranteed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] text-emerald-700 font-bold border border-emerald-100 shadow-sm">
                            🛡️ TurtleGüvence
                        </span>
                        )}
                        {listing.condition && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600 border border-gray-200">
                                {listing.condition === 'new' ? 'Sıfır' : listing.condition === 'like_new' ? 'Yeni Gibi' : listing.condition === 'good' ? 'İyi' : 'Makul'}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 truncate">
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
          <div className="flex gap-6">
            <Link to="/turtle-points" className="hover:text-emerald-600 transition">🗺️ TurtleNoktalar</Link>
            <Link to="/apply-point" className="hover:text-emerald-600 transition">🏪 Nokta Ol</Link>
          </div>
          <p>© 2026 TurtleShopping. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}