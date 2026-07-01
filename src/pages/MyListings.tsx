import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'
import type { Listing } from '../types'

export default function MyListings() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'deleted' | 'reserved' | 'pending'>('active')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login')
        return
      }
      fetchMyListings(data.user.id)
    })
  }, [navigate])

  async function fetchMyListings(userId: string) {
    const { data, error } = await supabase
      .from('listings')
      .select('*, categories(name, icon)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setListings(data)
    }
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: Listing['status']) {
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    } else {
      alert('Durum güncellenirken bir hata oluştu.')
    }
  }

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true
    return l.status === filter
  })

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📦</span>
            <h1 className="text-2xl font-black text-gray-800">
              İlanlarım <span className="text-gray-400 text-lg font-normal">({filteredListings.length})</span>
            </h1>
          </div>
          <Link to="/create-listing" className="btn-primary px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all">
            + Yeni İlan Ver
          </Link>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['active', 'pending', 'rejected', 'reserved', 'sold', 'deleted', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500'
                  : 'bg-white text-gray-500 border-2 border-transparent hover:bg-gray-100 shadow-sm'
              }`}
            >
              {f === 'active' ? '🟢 Yayında' : f === 'pending' ? '⏳ Onay Bekliyor' : f === 'rejected' ? '❌ Reddedildi' : f === 'reserved' ? '🐢 İşlemde' : f === 'sold' ? '🤝 Satıldı' : f === 'deleted' ? '🗑️ Silinenler' : 'Tümü'}
            </button>
          ))}
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl opacity-50">📋</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Bu Durumda İlanın Yok</h2>
            <p className="text-gray-500 max-w-sm mb-8">Henüz bu filtreye uygun bir ilanın bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map(listing => {
              const isInactive = listing.status !== 'active'
              
              return (
                <div key={listing.id} className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col relative ${isInactive ? 'opacity-80' : ''}`}>
                  <div className="flex p-4 gap-4">
                    <Link to={`/listing/${listing.id}`} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden relative">
                        {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center">
                                <span className="text-3xl">{(listing.categories as any)?.icon || '📦'}</span>
                            </div>
                        )}
                        {listing.status === 'sold' && (
                            <div className="absolute inset-0 bg-emerald-900 bg-opacity-60 flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-2 py-1 border border-white rounded">SATILDI</span>
                            </div>
                        )}
                        {listing.status === 'reserved' && (
                            <div className="absolute inset-0 bg-amber-900 bg-opacity-60 flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-2 py-1 border border-white rounded">İŞLEMDE</span>
                            </div>
                        )}
                        {listing.status === 'pending' && (
                            <div className="absolute inset-0 bg-blue-900 bg-opacity-60 flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-2 py-1 border border-white rounded text-center">ONAY<br/>BEKLİYOR</span>
                            </div>
                        )}
                        {listing.status === 'rejected' && (
                            <div className="absolute inset-0 bg-red-900 bg-opacity-70 flex items-center justify-center">
                                <span className="text-white text-xs font-bold px-2 py-1 border border-white rounded">REDDEDİLDİ</span>
                            </div>
                        )}
                    </Link>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{listing.title}</h3>
                        <p className="text-emerald-600 font-black mt-1">{listing.price?.toLocaleString('tr-TR')} ₺</p>
                        <p className="text-xs text-gray-400 mt-1">{(listing.categories as any)?.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                         <span className="text-[10px] text-gray-400 flex items-center gap-1">👁️ {listing.view_count || 0} görüntülenme</span>
                      </div>
                    </div>
                  </div>

                  {listing.status === 'rejected' && listing.rejection_reason && (
                    <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
                      <strong>Ret Sebebi:</strong> {listing.rejection_reason}
                    </div>
                  )}

                  <div className="px-4 pb-4 flex gap-2">
                    {listing.status === 'reserved' ? (
                      <div className="flex-1 py-2 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl text-center border border-amber-200">
                        🐢 İşlem Devam Ediyor
                      </div>
                    ) : listing.status === 'pending' ? (
                      <div className="flex-1 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl text-center border border-blue-200">
                        ⏳ Yönetici Onayı Bekleniyor
                      </div>
                    ) : (
                      <>
                        <Link to={`/edit-listing/${listing.id}`} className="flex-1 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-1 border border-gray-200">
                          ✏️ Düzenle
                        </Link>
                        
                        {listing.status === 'active' && (
                            <button onClick={() => updateStatus(listing.id, 'sold')}
                                className="flex-1 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition border border-emerald-200">
                                🤝 Satıldı İşaretle
                            </button>
                        )}
                        {listing.status !== 'deleted' && (
                            <button onClick={() => {
                                if(confirm('İlanı silmek istediğine emin misin?')) updateStatus(listing.id, 'deleted')
                            }}
                                className="py-2 px-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition border border-red-100">
                                🗑️
                            </button>
                        )}
                        {listing.status === 'deleted' && (
                            <button onClick={() => updateStatus(listing.id, 'pending')}
                                className="flex-1 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition border border-blue-200">
                                🔄 Tekrar Onaya Gönder
                            </button>
                        )}
                      </>
                    )}
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
