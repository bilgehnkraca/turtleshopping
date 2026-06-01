import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'bilgekral04@gmail.com'

export default function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'applications' | 'verifications'>('applications')
  const [applications, setApplications] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
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
    const { data: apps } = await supabase
      .from('point_applications')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: vers } = await supabase
      .from('listing_verifications')
      .select('*, listings(title, price, images), turtle_points(name, city)')
      .order('created_at', { ascending: false })

    setApplications(apps || [])
    setVerifications(vers || [])
    setLoading(false)
  }

  async function approveApplication(app: any) {
    // turtle_points tablosuna ekle
    await supabase.from('turtle_points').insert({
      name: app.name,
      address: app.address,
      city: app.city,
      phone: app.phone,
      email: app.owner_email,
    })

    // Başvuruyu onayla
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

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      verified: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      pending: 'Bekliyor',
      approved: 'Onaylandı',
      verified: 'Doğrulandı',
      rejected: 'Reddedildi',
    }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐢</span>
            <span className="text-xl font-bold text-gray-800">TurtleShopping</span>
          </Link>
          <span className="text-sm text-gray-500 font-medium">⚙️ Admin Paneli</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Paneli</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'applications' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            🏪 Nokta Başvuruları ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'verifications' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            🛡️ Doğrulama İstekleri ({verifications.filter(v => v.status === 'pending').length})
          </button>
        </div>

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
      </div>
    </div>
  )
}