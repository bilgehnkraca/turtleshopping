import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'
import type { Listing, UserReview } from '../types'
import type { Profile as ProfileType } from '../types'
import { cities } from '../data/cities'

export default function ProfilePage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  
  // Review form states
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // OTP Verification states
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user?.id || null))
    fetchProfile()
  }, [id])

  async function fetchProfile() {
    setLoading(true)
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

    const { data: reviewData } = await supabase
      .from('user_reviews')
      .select('*, reviewer:profiles!user_reviews_reviewer_id_fkey(username, full_name, avatar_url)')
      .eq('target_user_id', id)
      .order('created_at', { ascending: false })
    setReviews((reviewData as any) || [])

    setLoading(false)
  }

  async function handleSave() {
    await supabase.from('profiles').update({ full_name: fullName, city, phone }).eq('id', id)
    setEditing(false)
    fetchProfile()
  }

  async function submitReview() {
    if (!currentUser || !id) return
    setSubmittingReview(true)
    const { error } = await supabase.from('user_reviews').insert({
      reviewer_id: currentUser,
      target_user_id: id,
      rating: newRating,
      comment: newComment
    })
    
    if (!error) {
      setShowReviewModal(false)
      setNewComment('')
      setNewRating(5)
      fetchProfile()
    } else {
      alert('Değerlendirme gönderilirken bir hata oluştu.')
      console.error(error)
    }
    setSubmittingReview(false)
  }

  async function sendOtp() {
    if (!profile?.phone || !currentUser) return
    setIsSendingOtp(true)
    setOtpError('')
    
    // Generate a random 6 digit code for simulation
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60000) // 10 minutes from now

    const { error } = await supabase.from('phone_verifications').insert({
      user_id: currentUser,
      phone: profile.phone,
      code,
      expires_at: expiresAt.toISOString()
    })

    setIsSendingOtp(false)

    if (error) {
      console.error(error)
      alert('Kod gönderilirken bir hata oluştu: ' + error.message)
      return
    }

    // In a real app, this is where you'd trigger Netgsm/Twilio SMS API via Edge Functions.
    // For local testing, we just alert it.
    alert(`TEST MODU - Telefonuna Gelen SMS Kodu: ${code}`)
    setShowOtpModal(true)
  }

  async function verifyOtp() {
    if (!profile?.phone || !currentUser) return
    setIsVerifyingOtp(true)
    setOtpError('')

    // Check if the code exists and is valid
    const { data, error } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', currentUser)
      .eq('phone', profile.phone)
      .eq('code', otpCode)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      setOtpError('Hatalı veya süresi dolmuş kod girdiniz.')
      setIsVerifyingOtp(false)
      return
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ phone_verified: true })
      .eq('id', currentUser)

    setIsVerifyingOtp(false)

    if (updateError) {
      setOtpError('Profil güncellenirken hata oluştu.')
    } else {
      setShowOtpModal(false)
      setOtpCode('')
      fetchProfile() // Refresh profile state to show verified badge
    }
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
      <Navbar />

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
              <div>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Telefon (Örn: 05551234567)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-gray-400 mt-1">Numaranızı değiştirirseniz yeniden doğrulamanız gerekecektir.</p>
              </div>
              <div className="flex gap-2 mt-2">
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
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {profile.full_name || profile.username}
                      {profile.phone_verified && (
                        <span title="Telefon Onaylı" className="text-emerald-500 text-sm bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                          ✓
                        </span>
                      )}
                    </h2>
                    {profile.city && <p className="text-sm text-gray-500 mt-1">📍 {profile.city}</p>}
                    
                    {profile.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500">📞 {profile.phone}</p>
                        {profile.phone_verified ? (
                          <span className="text-xs text-emerald-600 font-medium">Doğrulandı</span>
                        ) : (
                          isOwner && (
                            <button 
                              onClick={sendOtp}
                              disabled={isSendingOtp}
                              className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded hover:bg-amber-200 transition disabled:opacity-50">
                              {isSendingOtp ? 'Gönderiliyor...' : 'Doğrula'}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  {!isOwner && currentUser && (
                    <button onClick={() => setShowReviewModal(true)}
                      className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 transition">
                      ⭐ Değerlendir
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium mb-1">TurtlePuan</span>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      <span className="text-amber-400 text-lg">⭐</span>
                      <span className="font-bold text-gray-800">{profile.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-xs text-gray-400">({profile.review_count} değ.)</span>
                    </div>
                  </div>
                  {(profile.rating || 0) >= 4.0 && profile.review_count > 0 && profile.phone_verified && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium mb-1">Satıcı Durumu</span>
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                        🌟 Süper Satıcı
                      </span>
                    </div>
                  )}
                  {((profile.rating || 0) < 4.0 || profile.review_count === 0 || !profile.phone_verified) && (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium mb-1">Satıcı Durumu</span>
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg">
                        👤 Standart Satıcı
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {isOwner && (
                <button onClick={() => setEditing(true)}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                  Profili Düzenle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Değerlendirmeler ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">Henüz değerlendirme yapılmamış.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                        {(review.reviewer?.full_name || review.reviewer?.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{review.reviewer?.full_name || review.reviewer?.username}</p>
                        <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-500 text-sm font-bold">
                      ⭐ {review.rating}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Değerlendirme Yap</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Puanınız</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setNewRating(star)}
                    className={`text-2xl transition ${star <= newRating ? 'text-amber-400' : 'text-gray-200'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Yorumunuz (İsteğe bağlı)</label>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Kullanıcı ile olan deneyiminizi anlatın..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={submitReview} disabled={submittingReview}
                className="flex-1 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
                {submittingReview ? 'Gönderiliyor...' : 'Gönder'}
              </button>
              <button onClick={() => setShowReviewModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Telefonunu Doğrula</h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{profile?.phone}</strong> numarasına bir mesaj (SMS) gönderdik. Lütfen mesajdaki <strong>6 Haneli Doğrulama Kodunu</strong> aşağıdaki kutucuğa girin. Telefon numaranızı YAZMAYIN. (Test modu: Kodu alert olarak gördünüz)
            </p>
            
            {otpError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {otpError}
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="6 Haneli Kodu Girin"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={verifyOtp} disabled={isVerifyingOtp || otpCode.length < 6}
                className="flex-1 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50">
                {isVerifyingOtp ? 'Doğrulanıyor...' : 'Doğrula'}
              </button>
              <button onClick={() => setShowOtpModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}