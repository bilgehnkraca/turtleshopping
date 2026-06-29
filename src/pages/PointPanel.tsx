import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'

export default function PointPanel() {
  const navigate = useNavigate()
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [point, setPoint] = useState<any>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function fetchVerifications(pointId: number) {
    const { data } = await supabase
      .from('listing_verifications')
      .select('*, listings(title, price, images, description, condition), profiles!listing_verifications_verified_by_fkey(username)')
      .eq('point_id', pointId)
      .order('created_at', { ascending: false })
    setVerifications(data || [])
    setLoading(false)
  }

  async function fetchPoint(userId: string) {
    const { data } = await supabase
      .from('turtle_points')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!data) {
      const { data: user } = await supabase.auth.getUser()
      const { data: pointByEmail } = await supabase
        .from('turtle_points')
        .select('*')
        .eq('email', user.user?.email)
        .eq('is_active', true)
        .maybeSingle()

      if (!pointByEmail) {
        navigate('/')
        return
      }
      setPoint(pointByEmail)
      fetchVerifications(pointByEmail.id)
      return
    }

    setPoint(data)
    fetchVerifications(data.id)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/login'); return }
      fetchPoint(data.user.id)
    })
  }, [])

  async function approveVerification(ver: any) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('listing_verifications').update({
      status: 'verified',
      notes: notes[ver.id] || '',
      verified_by: user?.id,
      updated_at: new Date().toISOString(),
    }).eq('id', ver.id)

    await supabase.from('listings').update({ verified: true }).eq('id', ver.listing_id)
    fetchVerifications(point.id)
  }

  async function rejectVerification(ver: any) {
    await supabase.from('listing_verifications').update({
      status: 'rejected',
      notes: notes[ver.id] || '',
      updated_at: new Date().toISOString(),
    }).eq('id', ver.id)
    fetchVerifications(point.id)
  }

  const conditionLabels: Record<string, string> = {
    new: 'Sıfır', like_new: 'Sıfır Gibi', good: 'İyi', fair: 'Makul'
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    }
    const labels: Record<string, string> = {
      pending: '⏳ Bekliyor',
      verified: '✅ Doğrulandı',
      rejected: '❌ Reddedildi',
    }
    return (
      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* PoS Header */}
      <nav className="bg-gray-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-3xl">🐢</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Turtle Terminal</h1>
              <p className="text-xs text-gray-400">Nokta Operasyon Sistemi</p>
            </div>
          </Link>
          <div className="text-right">
            <p className="font-bold text-emerald-400">{point?.name}</p>
            <p className="text-xs text-gray-400">Aktif Terminal</p>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 w-full flex-1">
        
        {/* QR Kod Aksiyon Alanı */}
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-8 mb-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-4">
            📷
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">QR Kod ile İşlem Yap</h2>
          <p className="text-gray-500 mb-6 max-w-sm">Müşterinin getirdiği ürün üzerindeki veya uygulamasındaki QR kodu okutarak teslim alma sürecini başlatın.</p>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-lg transition transform hover:scale-105 w-full max-w-md flex items-center justify-center gap-3">
            <span>Kamerayı Aç ve Tara</span>
          </button>
          <button className="mt-4 text-emerald-600 font-bold text-sm hover:underline">
            veya manuel Teslimat Kodu gir
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-800">
            Bekleyen İşlemler
          </h2>
          <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
            {verifications.filter(v => v.status === 'pending').length} Sipariş
          </span>
        </div>

        {verifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-bold">Bekleyen işlem bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verifications.map(ver => (
              <div key={ver.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="font-mono text-xs text-gray-500 font-bold">#TRT-{ver.id.substring(0,6).toUpperCase()}</span>
                  {statusBadge(ver.status)}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    {ver.listings?.images?.[0] ? (
                      <img src={ver.listings.images[0]} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📦</div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800 leading-tight">{ver.listings?.title}</h3>
                      <p className="text-emerald-600 font-black mt-1">{ver.listings?.price?.toLocaleString('tr-TR')} ₺</p>
                      <span className="inline-block mt-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                        Kondisyon: {conditionLabels[ver.listings?.condition] || '-'}
                      </span>
                    </div>
                  </div>

                  {ver.status === 'pending' && (
                    <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                      <textarea
                        value={notes[ver.id] || ''}
                        onChange={e => setNotes(prev => ({ ...prev, [ver.id]: e.target.value }))}
                        placeholder="Kontrol notu ekle (Zorunlu değil)..."
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-500 mb-3 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => approveVerification(ver)}
                          className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition">
                          Onayla
                        </button>
                        <button onClick={() => rejectVerification(ver)}
                          className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition">
                          Reddet
                        </button>
                      </div>
                    </div>
                  )}

                  {ver.notes && (
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <span className="font-bold text-amber-700">Not:</span> {ver.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}