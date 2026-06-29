import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'bilgekral04@gmail.com'

export default function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pending_listings' | 'applications' | 'verifications' | 'reports'>('pending_listings')
  const [pendingListings, setPendingListings] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.email !== ADMIN_EMAIL) {
        navigate('/')
        return
      }
      fetchData()
    })
  }, [])

  async function fetchData() {
    const { data: pending } = await supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(username, full_name), categories(name, icon)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const { data: apps } = await supabase
      .from('point_applications')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: vers } = await supabase
      .from('listing_verifications')
      .select('*, listings(title, price, images), turtle_points(name, city)')
      .order('created_at', { ascending: false })

    const { data: reps } = await supabase
      .from('listing_reports')
      .select('*, listings(title, price, images), profiles!listing_reports_reporter_id_fkey(username, full_name)')
      .order('created_at', { ascending: false })

    setPendingListings(pending || [])
    setApplications(apps || [])
    setVerifications(vers || [])
    setReports(reps || [])
    setLoading(false)
  }

  async function approveListing(id: string) {
    await supabase.from('listings').update({ status: 'active' }).eq('id', id)
    fetchData()
  }

  async function rejectListing(id: string) {
    await supabase.from('listings').update({ status: 'deleted' }).eq('id', id)
    fetchData()
  }

  async function approveApplication(app: any) {
    await supabase.from('turtle_points').insert({
      name: app.name,
      address: app.address,
      city: app.city,
      phone: app.phone,
      email: app.owner_email,
    })
    await supabase.from('point_applications').update({ status: 'approved' }).eq('id', app.id)
    fetchData()
  }

  async function rejectApplication(id: string) {
    await supabase.from('point_applications').update({ status: 'rejected' }).eq('id', id)
    fetchData()
  }

  async function approveVerification(ver: any) {
    await supabase.from('listing_verifications').update({ status: 'verified' }).eq('id', ver.id)
    await supabase.from('listings').update({ verified: true }).eq('id', ver.listing_id)
    fetchData()
  }

  async function rejectVerification(id: string) {
    await supabase.from('listing_verifications').update({ status: 'rejected' }).eq('id', id)
    fetchData()
  }

  async function dismissReport(id: string) {
    await supabase.from('listing_reports').update({ status: 'dismissed' }).eq('id', id)
    fetchData()
  }

  async function removeListingFromReport(rep: any) {
    await supabase.from('listings').update({ status: 'deleted' }).eq('id', rep.listing_id)
    await supabase.from('listing_reports').update({ status: 'reviewed' }).eq('id', rep.id)
    fetchData()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      verified: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      reviewed: 'bg-blue-100 text-blue-700',
      dismissed: 'bg-gray-100 text-gray-500',
    }
    const labels: Record<string, string> = {
      pending: 'Bekliyor',
      approved: 'Onaylandı',
      verified: 'Doğrulandı',
      rejected: 'Reddedildi',
      reviewed: 'İncelendi',
      dismissed: 'Geçildi',
    }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
  }

  const reasonLabels: Record<string, string> = {
    dolandirici: '🚨 Dolandırıcı',
    yaniltici: '⚠️ Yanıltıcı',
    kopya: '📋 Kopya',
    uygunsuz: '🚫 Uygunsuz',
    diger: '📝 Diğer',
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            ⚙️ Sistem Komuta Merkezi
        </h1>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-3">📋</div>
            <span className="text-3xl font-black text-gray-800">{pendingListings.length}</span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Onay Bekleyen İlan</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl mb-3">🏪</div>
            <span className="text-3xl font-black text-gray-800">{applications.filter(a => a.status === 'pending').length}</span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Yeni Nokta Başvurusu</span>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl mb-3">🛡️</div>
            <span className="text-3xl font-black text-gray-800">{verifications.filter(v => v.status === 'pending').length}</span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Aktif Doğrulama Sırası</span>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl mb-3">🚨</div>
            <span className="text-3xl font-black text-red-600">{reports.filter(r => r.status === 'pending').length}</span>
            <span className="text-xs text-red-500 font-bold uppercase tracking-wider mt-1">Çözümsüz Şikayetler</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <button onClick={() => setActiveTab('pending_listings')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${activeTab === 'pending_listings' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            İlanlar
          </button>
          <button onClick={() => setActiveTab('applications')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${activeTab === 'applications' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            Noktalar
          </button>
          <button onClick={() => setActiveTab('verifications')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${activeTab === 'verifications' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            Doğrulamalar
          </button>
          <button onClick={() => setActiveTab('reports')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition ${activeTab === 'reports' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'}`}>
            Şikayetler
          </button>
        </div>

        {/* Bekleyen İlanlar */}
        {activeTab === 'pending_listings' && (
          <div className="flex flex-col gap-4">
            {pendingListings.length === 0 ? (
              <p className="text-gray-400 text-center py-12">Bekleyen ilan yok.</p>
            ) : pendingListings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex gap-4 items-start mb-3">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {listing.categories?.icon || '📦'}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{listing.title}</h3>
                    <p className="text-emerald-600 font-bold">{listing.price?.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-sm text-gray-500">
                      {listing.categories?.icon} {listing.categories?.name} · {listing.city}
                    </p>
                    <p className="text-sm text-gray-500">
                      👤 {listing.profiles?.full_name || listing.profiles?.username}
                    </p>
                    {listing.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{listing.description}</p>
                    )}
                  </div>
                  <Link to={`/listing/${listing.id}`} target="_blank">
                    <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-100 transition">
                      👁️ Önizle
                    </button>
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveListing(listing.id)}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
                    ✅ Yayınla
                  </button>
                  <button onClick={() => rejectListing(listing.id)}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                    ❌ Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nokta Başvuruları */}
        {activeTab === 'applications' && (
          <div className="flex flex-col gap-4">
            {applications.length === 0 ? (
              <p className="text-gray-400 text-center py-12">Henüz başvuru yok.</p>
            ) : applications.map(app => (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{app.name}</h3>
                    <p className="text-sm text-gray-500">📍 {app.address}, {app.city}</p>
                    <p className="text-sm text-gray-500">👤 {app.owner_name} — {app.owner_email}</p>
                    <p className="text-sm text-gray-500">📞 {app.phone}</p>
                    {app.about && <p className="text-sm text-gray-600 mt-2 italic">"{app.about}"</p>}
                  </div>
                  {statusBadge(app.status)}
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveApplication(app)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
                      ✅ Onayla
                    </button>
                    <button onClick={() => rejectApplication(app.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                      ❌ Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Doğrulama İstekleri */}
        {activeTab === 'verifications' && (
          <div className="flex flex-col gap-4">
            {verifications.length === 0 ? (
              <p className="text-gray-400 text-center py-12">Henüz doğrulama isteği yok.</p>
            ) : verifications.map(ver => (
              <div key={ver.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-start">
                    {ver.listings?.images?.[0] ? (
                      <img src={ver.listings.images[0]} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📦</div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800">{ver.listings?.title}</h3>
                      <p className="text-sm text-emerald-600 font-bold">{ver.listings?.price?.toLocaleString('tr-TR')} ₺</p>
                      <p className="text-sm text-gray-500">🏪 {ver.turtle_points?.name} — {ver.turtle_points?.city}</p>
                    </div>
                  </div>
                  {statusBadge(ver.status)}
                </div>
                {ver.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveVerification(ver)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
                      ✅ Doğrulandı
                    </button>
                    <button onClick={() => rejectVerification(ver.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                      ❌ Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Şikayetler */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-4">
            {reports.length === 0 ? (
              <p className="text-gray-400 text-center py-12">Henüz şikayet yok.</p>
            ) : reports.map(rep => (
              <div key={rep.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-start">
                    {rep.listings?.images?.[0] ? (
                      <img src={rep.listings.images[0]} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📦</div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800">{rep.listings?.title}</h3>
                      <p className="text-sm text-emerald-600 font-bold">{rep.listings?.price?.toLocaleString('tr-TR')} ₺</p>
                      <p className="text-sm text-gray-500">Şikayet: {reasonLabels[rep.reason] || rep.reason}</p>
                      <p className="text-sm text-gray-500">Şikayetçi: {rep.profiles?.full_name || rep.profiles?.username}</p>
                      {rep.description && <p className="text-sm text-gray-600 mt-1 italic">"{rep.description}"</p>}
                    </div>
                  </div>
                  {statusBadge(rep.status)}
                </div>
                {rep.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => removeListingFromReport(rep)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">
                      🗑️ İlanı Kaldır
                    </button>
                    <button onClick={() => dismissReport(rep.id)}
                      className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                      Geç
                    </button>
                    <Link to={`/listing/${rep.listing_id}`} target="_blank">
                      <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition">
                        👁️ İlanı Gör
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}