import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { cities } from '../data/cities'
import type { Category } from '../types'

export default function CreateListing() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const imageUrls = await uploadImages(user.id)

    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      title,
      description,
      price: parseFloat(price),
      category_id: parseInt(categoryId),
      condition,
      city,
      images: imageUrls,
    })

    if (error) setError(error.message)
    else navigate('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/" className="text-2xl font-bold text-blue-600">🐢 TurtleShopping</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">İlan Ver</h2>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">

          {/* Fotoğraf yükleme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotoğraflar (max 5)</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition bg-gray-50">
              <span className="text-gray-400 text-sm">📷 Fotoğraf ekle</span>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((p, i) => (
                  <img key={i} src={p} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Seç</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Durumu</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="new">Sıfır</option>
              <option value="like_new">Sıfır Gibi</option>
              <option value="good">İyi</option>
              <option value="fair">Makul</option>
            </select>
          </div>

          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
  <select value={city} onChange={e => setCity(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
    <option value="">Şehir seç</option>
    {cities.map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>
</div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 mt-2">
            {loading ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
          </button>
        </div>
      </div>
    </div>
  )
}