import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cities } from '../data/cities'
import { Navbar } from '../components/Navbar'

export default function ApplyPoint() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [about, setAbout] = useState('')

  async function handleSubmit() {
    if (!name || !address || !city || !phone || !ownerName || !ownerEmail) {
      setError('Lütfen tüm zorunlu alanları doldurun.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.from('point_applications').insert({
      name,
      address,
      city,
      phone,
      owner_name: ownerName,
      owner_email: ownerEmail,
      about,
      status: 'pending',
    })

    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Başvurunuz Alındı!</h2>
        <p className="text-gray-500 mb-6">Ekibimiz başvurunuzu inceleyecek ve en kısa sürede size dönecek.</p>
        <Link to="/">
          <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition">
            Ana Sayfaya Dön
          </button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">🏪 TurtleNokta Ol</h1>
          <p className="text-gray-500">
            İşletmenizi TurtleNokta yapın, ek gelir elde edin ve müşterilerinize güvenli alışveriş imkanı sunun.
          </p>
        </div>

        {/* Avantajlar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '💰', title: 'Ek Gelir', desc: 'Her doğrulamadan komisyon alın' },
            { icon: '👥', title: 'Müşteri', desc: 'Yeni müşteriler kazanın' },
            { icon: '🏅', title: 'Rozet', desc: 'Onaylı nokta rozetini taşıyın' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="font-bold text-gray-800 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Başvuru Formu</h2>

          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Örn: Ahmet Elektronik"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                <option value="">Şehir seç</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Açık adres"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="05xx xxx xx xx"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Adı *</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
              <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İşletmeniz Hakkında</label>
              <textarea value={about} onChange={e => setAbout(e.target.value)}
                placeholder="İşletmenizden kısaca bahsedin..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition disabled:opacity-50 mt-2">
              {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}