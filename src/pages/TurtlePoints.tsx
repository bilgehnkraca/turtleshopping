import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'

export default function TurtlePoints() {
  const [points, setPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState('')

  async function fetchPoints() {
    let query = supabase
      .from('turtle_points')
      .select('*')
      .eq('is_active', true)
      .order('city')

    if (selectedCity) query = query.eq('city', selectedCity)

    const { data } = await query
    setPoints(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPoints()
  }, [selectedCity])

  const cities = [...new Set(points.map(p => p.city))].sort()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Başlık */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">🗺️ TurtleNoktalar</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Satın almadan önce ürünü doğrulayın. Size en yakın TurtleNokta'ya gidin,
            uzmanlarımız ürünü kontrol edip onaylasın.
          </p>
        </div>

        {/* Nasıl çalışır */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: '📦', title: 'Satıcı Getirir', desc: 'Satıcı ürünü en yakın TurtleNokta\'ya götürür' },
            { icon: '🔍', title: 'Uzman Kontrol', desc: 'Ekibimiz ürünü detaylıca inceler ve sisteme kaydeder' },
            { icon: '✅', title: 'Güvenle Al', desc: 'Doğrulanmış ürünü güvenle satın alırsın' },
          ].map((step, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-gray-800 mb-1">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Filtre */}
        {cities.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setSelectedCity('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!selectedCity ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
              Tümü
            </button>
            {cities.map(c => (
              <button key={c} onClick={() => setSelectedCity(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedCity === c ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Nokta listesi */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        ) : points.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📍</p>
            <p>Bu şehirde henüz nokta yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {points.map(point => (
              <div key={point.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    🏪
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{point.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">📍 {point.address}, {point.city}</p>
                    {point.phone && <p className="text-sm text-gray-500">📞 {point.phone}</p>}
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">Aktif</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}