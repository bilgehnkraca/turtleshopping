import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types'

const conditionLabels: Record<string, string> = {
  new: 'Sıfır',
  like_new: 'Sıfır Gibi',
  good: 'İyi',
  fair: 'Makul',
}

const reportReasons: Record<string, string> = {
  dolandirici: '🚨 Dolandırıcı',
  yaniltici: '⚠️ Yanıltıcı İlan',
  kopya: '📋 Kopya İlan',
  uygunsuz: '🚫 Uygunsuz İçerik',
  diger: '📝 Diğer',
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [verification, setVerification] = useState<any>(null)
  const [turtlePoints, setTurtlePoints] = useState<any[]>([])
  const [selectedPoint, setSelectedPoint] = useState('')
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [similarListings, setSimilarListings] = useState<any[]>([])

  useEffect(() => {
    fetchListing()
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id || null
      setCurrentUser(userId)
      if (userId) checkFavorite(userId)
    })
    supabase.from('turtle_points').select('*').eq('is_active', true).then(({ data }) => setTurtlePoints(data || []))
  }, [id])

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles!listings_user_id_fkey(username, city, full_name), categories(name, icon)')
      .eq('id', id)
      .single()
    setListing(data)
    setLoading(false)

    if (data) {
      await supabase.from('listings').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
      if (data.verification_id) {
        const { data: vData } = await supabase
          .from('listing_verifications')
          .select('*, turtle_points(name, city)')
          .eq('id', data.verification_id)
          .single()
        setVerification(vData)
      }
      console.log('category_id:', data.category_id, 'id:', data.id)
      fetchSimilarListings(data.category_id, data.id)
    }
  }

  async function fetchSimilarListings(categoryId: number, currentId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('*, categories(name, icon)')
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', currentId)
    .limit(4)
  console.log('similar:', data, error)
  setSimilarListings(data || [])
}

  async function checkFavorite(userId: string) {
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', id)
      .maybeSingle()
    setIsFavorited(!!data)
  }

  async function toggleFavorite() {
    if (!currentUser) { navigate('/login'); return }
    if (isFavorited) {
      await supabase.from('favorites').delete()
        .eq('user_id', currentUser).eq('listing_id', id)
      setIsFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: currentUser, listing_id: id })
      setIsFavorited(true)
    }
  }

  async function handleContact() {
    if (!currentUser) { navigate('/login'); return }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', id)
      .eq('buyer_id', currentUser)
      .maybeSingle()

    if (existing) {
      navigate(`/conversation/${existing.id}`)
      return
    }

    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        listing_id: id,
        buyer_id: currentUser,
        seller_id: listing?.user_id,
      })
      .select()
      .single()

    if (conv) navigate(`/conversation/${conv.id}`)
  }

  async function handleVerificationRequest() {
    if (!selectedPoint) return
    setVerifyLoading(true)

    const { data: vData } = await supabase
      .from('listing_verifications')
      .insert({
        listing_id: id,
        point_id: parseInt(selectedPoint),
        status: 'pending',
      })
      .select()
      .single()

    if (vData) {
      await supabase.from('listings').update({ verification_id: vData.id }).eq('id', id)
      setVerification(vData)
      setShowVerifyModal(false)
      await supabase.functions.invoke('notify-turtle-point', {
        body: { verification_id: vData.id }
      })
    }
    setVerifyLoading(false)
  }

  async function handleReport() {
    if (!currentUser) { navigate('/login'); return }
    if (!reportReason) return
    setReportLoading(true)

    await supabase.from('listing_reports').insert({
      listing_id: id,
      reporter_id: currentUser,
      reason: reportReason,
      description: reportDescription,
    })

    setReportSent(true)
    setReportLoading(false)
    setTimeout(() => {
      setShowReportModal(false)
      setReportSent(false)
      setReportReason('')
      setReportDescription('')
    }, 2000)
  }

  function shareListing() {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: `${listing?.title} - ${listing?.price.toLocaleString('tr-TR')} ₺`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link kopyalandı!')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">İlan bulunamadı.</p>
    </div>
  )

  const profile = listing.profiles as any
  const category = listing.categories as any
  const isOwner = currentUser === listing.user_id
  const isVerified = (listing as any).verified === true
  const isSuspended = (listing as any).suspended === true
  const verificationPending = verification && verification.status === 'pending'
  const images = listing.images || []

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {images.length > 0 ? (
            <div>
              <img src={images[activeImage]} alt={listing.title}
                className="w-full max-h-96 object-cover" />
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <img key={i} src={img} alt={`${listing.title} ${i+1}`}
                      onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 transition ${
                        activeImage === i ? 'ring-2 ring-emerald-500' : 'opacity-60 hover:opacity-100'
                      }`} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-6xl">
              {category?.icon || '📦'}
            </div>
          )}

          <div className="p-6">
            {isSuspended && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <span className="text-red-500 text-xl">⚠️</span>
                <div>
                  <p className="text-red-700 font-semibold text-sm">Bu İlan İnceleme Altında</p>
                  <p className="text-red-600 text-xs">Birden fazla şikayet aldı, ekibimiz inceliyor.</p>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 shadow-sm">
                <span className="text-emerald-600 text-xl">✅</span>
                <div>
                  <p className="text-emerald-700 font-semibold text-sm">TurtleGüvence ile Doğrulandı</p>
                  <p className="text-emerald-600 text-xs">Bu ürün uzmanlarımız tarafından kontrol edilmiştir</p>
                </div>
              </div>
            )}

            {listing.is_guaranteed && !isVerified && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 shadow-sm">
                <span className="text-emerald-600 text-xl">🛡️</span>
                <div>
                  <p className="text-emerald-700 font-semibold text-sm">TurtleGüvence Seçili</p>
                  <p className="text-emerald-600 text-xs">Satıcı bu işlemde TurtleGüvence altyapısını tercih ediyor.</p>
                </div>
              </div>
            )}

            {verificationPending && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <span className="text-amber-500 text-xl">⏳</span>
                <div>
                  <p className="text-amber-700 font-semibold text-sm">Doğrulama Bekliyor</p>
                  <p className="text-amber-600 text-xs">
                    {verification?.turtle_points?.name} - {verification?.turtle_points?.city}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800 flex-1 mr-4">{listing.title}</h1>
              <div className="flex gap-2">
                <button onClick={shareListing} className="text-gray-400 hover:text-emerald-600 transition text-xl">🔗</button>
                <button onClick={toggleFavorite}
                  className={`text-2xl transition ${isFavorited ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
                  {isFavorited ? '❤️' : '🤍'}
                </button>
              </div>
            </div>

            <p className="text-3xl font-bold text-emerald-600 mb-4">{listing.price.toLocaleString('tr-TR')} ₺</p>

            <div className="flex gap-2 flex-wrap mb-4">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full border border-emerald-100">
                {conditionLabels[listing.condition]}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
                {category?.icon} {category?.name}
              </span>
              {listing.city && (
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
                  📍 {listing.city}
                </span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
               {listing.is_tradeable === false && (
                  <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded border border-red-100">
                      🚫 Takasa Kapalı
                  </span>
               )}
               {listing.is_bargainable === false && (
                  <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded border border-red-100">
                      🚫 Pazarlığa Kapalı
                  </span>
               )}
               {listing.is_tradeable === true && (
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded border border-blue-100">
                      🔄 Takasa Açık
                  </span>
               )}
               {listing.is_bargainable === true && (
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded border border-blue-100">
                      🤝 Pazarlığa Açık
                  </span>
               )}
            </div>

            {listing.description && (
              <p className="text-gray-600 leading-relaxed mb-6">{listing.description}</p>
            )}

            <p className="text-xs text-gray-400 mb-6">{listing.view_count} görüntülenme</p>

            <Link to={`/profile/${listing.user_id}`}>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4 hover:bg-gray-100 transition cursor-pointer">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                  {(profile?.full_name || profile?.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{profile?.full_name || profile?.username}</p>
                  {profile?.city && <p className="text-xs text-gray-500">📍 {profile.city}</p>}
                </div>
                <span className="ml-auto text-emerald-600 text-sm">→</span>
              </div>
            </Link>

            {isOwner && !verification && (
              <button onClick={() => setShowVerifyModal(true)}
                className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition text-sm mb-3">
                🛡️ TurtleGüvence ile Doğrulat
              </button>
            )}

            {!isOwner && (
              <>
                <button onClick={handleContact}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition text-sm mb-3">
                  Satıcıyla İletişime Geç
                </button>
                <button onClick={() => {
                  if (!currentUser) { navigate('/login'); return }
                  setShowReportModal(true)
                }}
                  className="w-full bg-red-50 text-red-500 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                  🚨 İlanı Şikayet Et
                </button>
              </>
            )}

            {isOwner && (
              <Link to={`/edit-listing/${id}`}>
                <button className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition text-sm">
                  ✏️ İlanı Düzenle
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Benzer İlanlar */}
        {similarListings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Benzer İlanlar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarListings.map(item => (
                <Link to={`/listing/${item.id}`} key={item.id} className="group" onClick={() => setActiveImage(0)}>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title}
                        className="w-full h-32 object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-3xl">
                        {item.categories?.icon || '📦'}
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-medium text-gray-800 text-sm truncate">{item.title}</p>
                      <p className="text-emerald-600 font-bold text-sm mt-1">{item.price.toLocaleString('tr-TR')} ₺</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">🛡️ TurtleGüvence</h2>
            <p className="text-gray-500 text-sm mb-6">
              Ürününüzü doğrulatmak için bir TurtleNokta seçin.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">TurtleNokta Seç</label>
            <select value={selectedPoint} onChange={e => setSelectedPoint(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white mb-4">
              <option value="">Nokta seç...</option>
              {turtlePoints.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={handleVerificationRequest} disabled={!selectedPoint || verifyLoading}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition disabled:opacity-50 text-sm">
                {verifyLoading ? 'Gönderiliyor...' : 'Doğrulama İsteği Gönder'}
              </button>
              <button onClick={() => setShowVerifyModal(false)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-800 transition">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            {reportSent ? (
              <div className="text-center py-4">
                <p className="text-4xl mb-3">✅</p>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Şikayetiniz Alındı</h2>
                <p className="text-gray-500 text-sm">Ekibimiz inceleyecek ve gerekli önlemi alacak.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-2">🚨 İlanı Şikayet Et</h2>
                <p className="text-gray-500 text-sm mb-4">Şikayet sebebini seçin:</p>
                <div className="flex flex-col gap-2 mb-4">
                  {Object.entries(reportReasons).map(([key, label]) => (
                    <button key={key} onClick={() => setReportReason(key)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition ${
                        reportReason === key
                          ? 'bg-red-50 border-2 border-red-300 text-red-700'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  placeholder="Detay eklemek ister misiniz? (opsiyonel)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={handleReport} disabled={!reportReason || reportLoading}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50 text-sm">
                    {reportLoading ? 'Gönderiliyor...' : 'Şikayet Gönder'}
                  </button>
                  <button onClick={() => setShowReportModal(false)}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:text-gray-800 transition">
                    İptal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}