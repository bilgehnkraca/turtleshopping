import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'
import type { Profile as ProfileType } from '../types'
import { cities } from '../data/cities'

export default function ProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.id || null))
    fetchProfile()
  }, [id])

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    setProfile(data)
    setFullName(data?.full_name || '')
    setCity(data?.city || '')
    setPhone(data?.phone || '')

    const { data: listingData } = await supabase
      .from('listings')
      .select('*, categories(name, icon)')
      .eq('user_id', id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setListings(listingData || [])
    setLoading(false)
  }

  async function handleSave() {
    await supabase.from('profiles').update({ full_name: fullName, city, phone }).eq('id', id)
    setEditing(false)
    fetchProfile()
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Profil bulunamadı.</p>
    </div>
  )

  const isOwner = currentUser === id
  const initials = (profile.full_name || profile.username || '?')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐢</span>
            <span className="text-xl font-bold text-gray-800">TurtleShopping</span>
          </Link>
          <Link to="/" className="text-emerald-600 text-sm hover:underline">← Ana Sayfa</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profil kartı */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          {editing ? (
            <div className="flex flex-col gap-3">
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">Şehir seç</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Telefon"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex gap-2">
                <button onClick={handleSave}
                  className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
                  Kaydet
                </button>
                <button onClick={() => setEditing(false)}
                  className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{profile.full_name || profile.username}</h2>
                {profile.city && <p className="text-sm text-gray-500 mt-1">📍 {profile.city}</p>}
                {profile.phone && <p className="text-sm text-gray-500">📞 {profile.phone}</p>}
                <p className="text-sm text-gray-500">⭐ {profile.rating} ({profile.review_count} değerlendirme)</p>
              </div>
              {isOwner && (
                <button onClick={() => setEditing(true)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  Düzenle
                </button>
              )}
            </div>
          )}
        </div>

        {/* İlanlar */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">İlanlar ({listings.length})</h3>
        {listings.length === 0 ? (
          <p className="text-gray-400 text-sm">Henüz ilan yok.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map(listing => (
              <Link to={`/listing/${listing.id}`} key={listing.id} className="group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={listing.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-3xl">
                      {(listing.categories as any)?.icon || '📦'}
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{listing.title}</h4>
                    <p className="text-emerald-600 font-bold text-sm mt-1">{listing.price.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(listing.categories as any)?.icon} {(listing.categories as any)?.name}
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