import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import locationsData from '../data/locations.json'

const locationDB = locationsData as any[]

export default function CreateListing() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState('good')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [isTradeable, setIsTradeable] = useState(false)
  const [isBargainable, setIsBargainable] = useState(false)

  // Location arrays
  const [districts, setDistricts] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
  }, [])

  // City changed
  useEffect(() => {
    setDistrict('')
    setNeighborhood('')
    if (city) {
      const cityData = locationDB.find((c: any) => c.name === city)
      setDistricts(cityData ? cityData.towns : [])
    } else {
      setDistricts([])
    }
  }, [city])

  // District changed
  useEffect(() => {
    setNeighborhood('')
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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  function validate() {
    const newErrors: Record<string, string> = {}

    if (title.trim().length < 10)
      newErrors.title = 'Başlık en az 10 karakter olmalı'
    if (description.trim().length < 20)
      newErrors.description = 'Açıklama en az 20 karakter olmalı'
    if (!price || parseFloat(price) <= 0)
      newErrors.price = 'Geçerli bir fiyat girin'
    if (!categoryId)
      newErrors.category = 'Kategori seçin'
    if (!city)
      newErrors.city = 'Şehir seçin'
    if (!district)
      newErrors.district = 'İlçe seçin'
    if (!neighborhood)
      newErrors.neighborhood = 'Mahalle seçin'
    if (images.length === 0)
      newErrors.images = 'En az 1 fotoğraf ekleyin'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function uploadImages(userId: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('listings').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('listings').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  async function handleSubmit() {
    if (!validate()) {
      alert("Lütfen formdaki kırmızı ile işaretlenmiş hataları düzeltin.")
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const imageUrls = await uploadImages(user.id)

    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: parseInt(categoryId),
      condition,
      city,
      district,
      neighborhood,
      images: imageUrls,
      status: 'active',
      is_tradeable: isTradeable,
      is_bargainable: isBargainable,
    })

    if (error) {
      console.error("Listing insert error:", error)
      setErrors({ general: error.message })
      alert("Hata: " + error.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/listing-submitted')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🐢</span>
            <span className="text-xl font-bold text-gray-800">TurtleShopping</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">İlan Ver</h2>
        <p className="text-gray-500 text-sm mb-6">İlanınız oluşturulduktan hemen sonra yayına girecektir.</p>

        {errors.general && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{errors.general}</p>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">

          {/* Fotoğraflar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotoğraflar <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(max 5)</span>
            </label>
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition bg-gray-50 ${
              errors.images ? 'border-red-300' : 'border-gray-200 hover:border-emerald-400'
            }`}>
              <span className="text-gray-400 text-sm">📷 Fotoğraf ekle</span>
              <span className="text-gray-300 text-xs mt-1">JPG, PNG, WEBP</span>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((p, i) => (
                  <img key={i} src={p} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                ))}
              </div>
            )}
          </div>

          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlık <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(min 10 karakter)</span>
            </label>
            <input value={title} onChange={e => {
              setTitle(e.target.value);
              if (e.target.value.trim().length >= 10) setErrors(prev => ({ ...prev, title: undefined }));
            }}
              placeholder="Ürününüzü kısaca tanıtın"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`} />
            <div className="flex justify-between mt-1">
              {errors.title
                ? <p className="text-red-500 text-xs">{errors.title}</p>
                : <span />}
              <span className={`text-xs ${title.length < 10 ? 'text-gray-300' : 'text-emerald-500'}`}>
                {title.length}/10
              </span>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(min 20 karakter)</span>
            </label>
            <textarea value={description} onChange={e => {
              setDescription(e.target.value);
              if (e.target.value.trim().length >= 20) setErrors(prev => ({ ...prev, description: undefined }));
            }}
              placeholder="Ürün hakkında detaylı bilgi verin: marka, model, kullanım süresi, kutusu var mı vs."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`} />
            <div className="flex justify-between mt-1">
              {errors.description
                ? <p className="text-red-500 text-xs">{errors.description}</p>
                : <span />}
              <span className={`text-xs ${description.length < 20 ? 'text-gray-300' : 'text-emerald-500'}`}>
                {description.length}/20
              </span>
            </div>
          </div>

          {/* Fiyat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiyat (₺) <span className="text-red-500">*</span>
            </label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="0"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.price ? 'border-red-300' : 'border-gray-200'
              }`} />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${
                errors.category ? 'border-red-300' : 'border-gray-200'
              }`}>
              <option value="">Seç</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Durum */}
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
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">İl Seçin</option>
                  {locationDB.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!city}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:opacity-70">
                  <option value="">İlçe Seçin</option>
                  {districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
              </div>
              
              <div>
                <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} disabled={!district}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:opacity-70">
                  <option value="">Mahalle Seçin</option>
                  {neighborhoods.map(n => (
                    <option key={n.name} value={n.name}>{n.name}</option>
                  ))}
                </select>
                {errors.neighborhood && <p className="text-red-500 text-sm mt-1">{errors.neighborhood}</p>}
              </div>
            </div>
          </div>

          {/* Ekstra Seçenekler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ekstra Seçenekler</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isTradeable} onChange={e => setIsTradeable(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                <span className="text-sm text-gray-700 font-medium">Takasa Açık (Diğer ürünlerle takas kabul ediyorum)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isBargainable} onChange={e => setIsBargainable(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                <span className="text-sm text-gray-700 font-medium">Pazarlığa Açık (Fiyatta indirim yapabilirim)</span>
              </label>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition disabled:opacity-50 mt-2">
            {loading ? 'Yükleniyor...' : 'İlanı Gönder'}
          </button>
        </div>
      </div>
    </div>
  )
}