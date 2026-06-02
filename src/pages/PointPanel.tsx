import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PointPanel() {
  const navigate = useNavigate()
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [point, setPoint] = useState<any>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/login'); return }
      fetchPoint(data.user.id)
    })
  }, [])

  async function fetchPoint(userId: string) {
    const { data } = await supabase
      .from('turtle_points')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (!data) {
      // owner_id ile eşleşme yoksa email ile dene
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

  async function fetchVerifications(pointId: number) {
    const { data } = await supabase
      .from('listing_verifications')
      .select('*, listings(title, price, images, description, condition), profiles!listing_verifications_verified_by_fkey(username)')
      .eq('point_id', pointId)
      .order('created_at', { ascending: false })
    setVerifications(data || [])
    setLoading(false)
  }

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
      pending: 'bg-amber-100 text-amber-700',
      verified: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      pending: '⏳ Bekliyor',
      verified: '✅ Doğrulandı',
      rejected: '❌ Reddedildi',
    }
    return (
      <span className={`text-xs font-medium px-3 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
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
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐢</span>
            <span className="text-xl font-bold text-gray-800">TurtleShopping</span>
          </Link>
          <span className="text-sm text-gray-500 font-medium">🏪 Nokta Paneli</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Nokta bilgisi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">🏪</div>
          <div>
            <h2 className="font-bold text-gray-800">{point?.name}</h2>
            <p className="text-sm text-gray-500">📍 {point?.address}, {point?.city}</p>
          </div>
          <div className="ml-auto">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">Aktif Nokta</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Doğrulama İstekleri
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({verifications.filter(v => v.status === 'pending').length} bekliyor)
          </span>
        </h2>

        {verifications.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>Henüz doğrulama isteği yok.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {verifications.map(ver => (
              <div key={ver.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4 mb-4">
                  {ver.listings?.images?.[0] ? (
                    <img src={ver.listings.images[0]} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">📦</div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800">{ver.listings?.title}</h3>
                      {statusBadge(ver.status)}
                    </div>
                    <p className="text-emerald-600 font-bold">{ver.listings?.price?.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Durum: {conditionLabels[ver.listings?.condition] || '-'}
                    </p>
                    {ver.listings?.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ver.listings.description}</p>
                    )}
                  </div>
                </div>

                {ver.status === 'pending' && (
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kontrol Notu</label>
                    <textarea
                      value={notes[ver.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [ver.id]: e.target.value }))}
                      placeholder="Ürün hakkında notunuzu yazın..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => approveVerification(ver)}
                        className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
                        ✅ Doğrulandı — Ürün Uygun
                      </button>
                      <button onClick={() => rejectVerification(ver)}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                        ❌ Reddet
                      </button>
                    </div>
                  </div>
                )}

                {ver.notes && (
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="text-sm text-gray-500"><span className="font-medium">Not:</span> {ver.notes}</p>
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