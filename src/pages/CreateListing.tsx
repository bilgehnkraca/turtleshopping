import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import { cities } from '../data/cities'

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

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
  }, [])

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
    if (!validate()) return
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
      images: imageUrls,
      status: 'pending',
    })

    if (error) setErrors({ general: error.message })
    else navigate('/listing-submitted')
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
        <p className="text-gray-500 text-sm mb-6">İlanınız ekibimiz tarafından incelendikten sonra yayına girecektir.</p>

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
            <input value={title} onChange={e => setTitle(e.target.value)}
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
            <textarea value={description} onChange={e => setDescription(e.target.value)}
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

          {/* Şehir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şehir <span className="text-red-500">*</span>
            </label>
            <select value={city} onChange={e => setCity(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${
                errors.city ? 'border-red-300' : 'border-gray-200'
              }`}>
              <option value="">Şehir seç</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
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