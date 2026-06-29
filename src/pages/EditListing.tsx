import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import locationsData from '../data/locations.json'
import { Navbar } from '../components/Navbar'

const locationDB = locationsData as any[]

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState('good')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [status, setStatus] = useState('active')

  // Location arrays
  const [districts, setDistricts] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])

  useEffect(() => {
    fetchListing()
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
  }, [id])

  async function fetchListing() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (!data || data.user_id !== user.id) {
      navigate('/')
      return
    }

    setTitle(data.title)
    setDescription(data.description || '')
    setPrice(String(data.price))
    setCategoryId(String(data.category_id))
    setCondition(data.condition)
    setCity(data.city || '')
    setDistrict(data.district || '')
    setNeighborhood(data.neighborhood || '')
    setStatus(data.status)
    setLoading(false)
  }

  // City changed
  useEffect(() => {
    if (city) {
      const cityData = locationDB.find((c: any) => c.name === city)
      setDistricts(cityData ? cityData.towns : [])
    } else {
      setDistricts([])
    }
  }, [city])

  // District changed
  useEffect(() => {
    if (district && districts && districts.length > 0) {
      const townData = districts.find((d: any) => d.name === district)
      if (townData && townData.districts) {
        const allQuarters = townData.districts.flatMap((d: any) => d.quarters || [])
        setNeighborhoods(allQuarters)
      } else {
        setNeighborhoods([])
      }
    } else {
      setNeighborhoods([])
    }
  }, [district, districts])

  async function handleSave() {
    setSaving(true)
    setError('')

    const { error } = await supabase.from('listings').update({
      title,
      description,
      price: parseFloat(price),
      category_id: parseInt(categoryId),
      condition,
      city,
      district,
      neighborhood,
      status,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) setError(error.message)
    else navigate(`/listing/${id}`)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('İlanı silmek istediğinizden emin misiniz?')) return

    await supabase.from('listings').update({ status: 'deleted' }).eq('id', id)
    navigate('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">İlanı Düzenle</h2>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">Seç</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Durumu</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="new">Sıfır</option>
              <option value="like_new">Sıfır Gibi</option>
              <option value="good">İyi</option>
              <option value="fair">Makul</option>
            </select>
          </div>

          {/* Konum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konum (İl / İlçe / Mahalle)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <select value={city} onChange={e => { setCity(e.target.value); setDistrict(''); setNeighborhood('') }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">İl Seçin</option>
                  {locationDB.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select value={district} onChange={e => { setDistrict(e.target.value); setNeighborhood('') }} disabled={!city}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:opacity-70">
                  <option value="">İlçe Seçin</option>
                  {districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} disabled={!district}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:opacity-70">
                  <option value="">Mahalle Seçin</option>
                  {neighborhoods.map(n => (
                    <option key={n.name} value={n.name}>{n.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İlan Durumu</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="active">Aktif</option>
              <option value="sold">Satıldı</option>
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={handleDelete}
              className="bg-red-50 text-red-600 px-5 py-3 rounded-xl font-medium hover:bg-red-100 transition">
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}