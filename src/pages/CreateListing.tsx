import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'
import type { Category, CategoryAttribute, AttributeValue } from '../types'
import locationsData from '../data/locations.json'

const locationDB = locationsData as any[]

export default function CreateListing() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasIban, setHasIban] = useState(false)

  // Step 1: Category
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryPath, setCategoryPath] = useState<number[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)

  // Step 2: Attributes
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [allAttributeValues, setAllAttributeValues] = useState<AttributeValue[]>([])
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({}) // attr_id -> value_id (or text)

  // Step 3: Photos & Condition
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [condition, setCondition] = useState('good')

  // Step 4: Details
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [isTradeable, setIsTradeable] = useState(false)
  const [isBargainable, setIsBargainable] = useState(false)
  const [districts, setDistricts] = useState<any[]>([])
  const [neighborhoods, setNeighborhoods] = useState<any[]>([])

  // Step 5: Review
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []))
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('iban').eq('id', user.id).single().then(({ data }) => {
          if (data && data.iban) setHasIban(true)
        })
      }
    })
  }, [])

  // Fetch Attributes when Category selected
  useEffect(() => {
    if (categoryId) {
      const fetchAttrs = async () => {
        const { data: attrs } = await supabase.from('category_attributes')
          .select('*').eq('category_id', categoryId).order('order', { ascending: true })
        
        if (attrs && attrs.length > 0) {
          setCategoryAttributes(attrs)
          const attrIds = attrs.map((a: any) => a.id)
          const { data: vals } = await supabase.from('attribute_values')
            .select('*').in('attribute_id', attrIds).order('order', { ascending: true })
          if (vals) setAllAttributeValues(vals)
        } else {
          setCategoryAttributes([])
          setAllAttributeValues([])
        }
        setSelectedAttributes({})
      }
      fetchAttrs()
    }
  }, [categoryId])

  // Location logic
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

  // Image handling
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  // Generate Title from Attributes
  useEffect(() => {
    if (step === 5) {
      let generatedTitle = ""
      const selectedCat = categories.find(c => c.id === categoryId)
      
      const attrNames: string[] = []
      categoryAttributes.forEach(attr => {
        const valId = selectedAttributes[attr.id]
        if (valId) {
          if (attr.type === 'select') {
            const valObj = allAttributeValues.find(v => v.id === valId)
            if (valObj) attrNames.push(valObj.value)
          } else {
            attrNames.push(valId)
          }
        }
      })
      
      if (attrNames.length > 0) {
        generatedTitle = attrNames.join(' ')
      } else if (selectedCat) {
        generatedTitle = selectedCat.name + " Ürünü"
      }
      setTitle(generatedTitle)
      if (!description) {
        setDescription(`${generatedTitle} satılıktır. Detaylı bilgi için mesaj atabilirsiniz.`)
      }
    }
  }, [step])

  // Validation
  function canGoNext() {
    if (step === 1) return categoryId !== null
    if (step === 2) {
      // Check required attributes
      for (const attr of categoryAttributes) {
        if (attr.is_required && !selectedAttributes[attr.id]) return false
      }
      return true
    }
    if (step === 3) return images.length > 0
    if (step === 4) return parseFloat(price) > 0 && city && district && neighborhood
    return true
  }

  async function uploadImages(userId: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      const { error } = await supabase.storage.from('listings').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('listings').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  async function handleSubmit() {
    if (!hasIban) {
      alert("Lütfen önce profilinizden IBAN bilginizi ekleyin.")
      return
    }
    if (!title || title.length < 5) {
      alert("Başlık çok kısa")
      return
    }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const imageUrls = await uploadImages(user.id)

    const { data: listingData, error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: categoryId,
      condition,
      city,
      district,
      neighborhood,
      images: imageUrls,
      status: 'active',
      is_tradeable: isTradeable,
      is_bargainable: isBargainable,
    }).select().single()

    if (error || !listingData) {
      alert("Hata: " + error?.message)
      setLoading(false)
      return
    }

    // Insert attributes
    const attrInserts = Object.keys(selectedAttributes).map(attrId => {
      const attrDef = categoryAttributes.find(a => a.id === attrId)
      const val = selectedAttributes[attrId]
      return {
        listing_id: listingData.id,
        attribute_id: attrId,
        value_id: attrDef?.type === 'select' ? val : null,
        custom_value: attrDef?.type !== 'select' ? val : null,
      }
    })

    if (attrInserts.length > 0) {
      await supabase.from('listing_attributes').insert(attrInserts)
    }

    navigate('/listing-submitted')
    setLoading(false)
  }

  // Dependent attributes logic
  function getOptionsForAttribute(attr: CategoryAttribute) {
    const options = allAttributeValues.filter(v => v.attribute_id === attr.id)
    // Check if options have parent_value_id
    const hasParents = options.some(o => o.parent_value_id !== null)
    if (!hasParents) return options

    // If they have parents, filter by currently selected parent
    // Find which attribute could be the parent. We just check if any selected value matches parent_value_id
    const selectedVals = Object.values(selectedAttributes)
    return options.filter(o => !o.parent_value_id || selectedVals.includes(o.parent_value_id))
  }

  function handleAttributeChange(attrId: string, value: string) {
    setSelectedAttributes(prev => {
      const next = { ...prev, [attrId]: value }
      
      let changed = true;
      while (changed) {
         changed = false;
         for (const attr of categoryAttributes) {
            const currentVal = next[attr.id];
            if (!currentVal) continue;

            const options = allAttributeValues.filter(v => v.attribute_id === attr.id);
            const hasParents = options.some(o => o.parent_value_id !== null);
            if (!hasParents) continue;

            const allSelectedVals = Object.values(next);
            const validOptions = options.filter(o => !o.parent_value_id || allSelectedVals.includes(o.parent_value_id));

            if (!validOptions.some(o => o.id === currentVal)) {
               delete next[attr.id];
               changed = true;
            }
         }
      }
      return next;
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 font-medium">
          <span className={step >= 1 ? 'text-emerald-600' : ''}>Kategori</span>
          <span>→</span>
          <span className={step >= 2 ? 'text-emerald-600' : ''}>Özellikler</span>
          <span>→</span>
          <span className={step >= 3 ? 'text-emerald-600' : ''}>Fotoğraf</span>
          <span>→</span>
          <span className={step >= 4 ? 'text-emerald-600' : ''}>Detaylar</span>
          <span>→</span>
          <span className={step >= 5 ? 'text-emerald-600' : ''}>Yayınla</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                {categoryPath.length > 0 && (
                  <button onClick={() => setCategoryPath(prev => prev.slice(0, -1))} className="text-gray-500 hover:text-gray-800 transition">
                    ←
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {categoryPath.length > 0 ? categories.find(c => c.id === categoryPath[categoryPath.length - 1])?.name + ' Alt Kategorileri' : 'Ne satıyorsunuz?'}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(categoryPath.length > 0 
                  ? categories.filter(c => c.parent_id === categoryPath[categoryPath.length - 1])
                  : categories.filter(c => !c.parent_id)
                ).map(c => (
                  <button key={c.id} onClick={() => {
                    const subs = categories.filter(x => x.parent_id === c.id)
                    if (subs.length > 0) {
                      setCategoryPath(prev => [...prev, c.id])
                      setCategoryId(null)
                    } else {
                      setCategoryId(c.id)
                    }
                  }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                      categoryId === c.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50 text-gray-700'
                    }`}>
                    <span className="text-3xl mb-2">{c.icon || (categoryPath.length > 0 ? '↳' : '📦')}</span>
                    <span className="font-semibold text-sm">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ürün Özellikleri</h2>
              {categoryAttributes.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">Bu kategori için ek özellik bulunmuyor.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {categoryAttributes.map(attr => (
                    <div key={attr.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attr.name} {attr.is_required && <span className="text-red-500">*</span>}
                      </label>
                      {attr.type === 'select' ? (
                        <select 
                          value={selectedAttributes[attr.id] || ''} 
                          onChange={e => handleAttributeChange(attr.id, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                        >
                          <option value="">Seçiniz...</option>
                          {getOptionsForAttribute(attr).map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.value}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type={attr.type === 'number' ? 'number' : 'text'}
                          value={selectedAttributes[attr.id] || ''}
                          onChange={e => handleAttributeChange(attr.id, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Durum ve Fotoğraflar</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Durumu</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'new', label: 'Sıfır' },
                    { id: 'like_new', label: 'Sıfır Gibi' },
                    { id: 'good', label: 'İyi' },
                    { id: 'fair', label: 'Makul' }
                  ].map(c => (
                    <button key={c.id} onClick={() => setCondition(c.id)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition ${
                        condition === c.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-600 hover:border-gray-200'
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotoğraflar <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(max 5)</span>
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-xl cursor-pointer transition bg-gray-50">
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
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Fiyat ve Konum</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat (₺) <span className="text-red-500">*</span>
                </label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-lg font-bold text-emerald-600" />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Konum Seçimi <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-3">
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white text-sm">
                    <option value="">İl Seçin</option>
                    {locationDB.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  
                  <select value={district} onChange={e => setDistrict(e.target.value)} disabled={!city}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white text-sm disabled:bg-gray-50">
                    <option value="">İlçe Seçin</option>
                    {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                  
                  <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} disabled={!district}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-white text-sm disabled:bg-gray-50">
                    <option value="">Mahalle Seçin</option>
                    {neighborhoods.map(n => <option key={n.name} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isTradeable} onChange={e => setIsTradeable(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700 font-medium">Takasa Açık</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isBargainable} onChange={e => setIsBargainable(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700 font-medium">Pazarlığa Açık</span>
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Son Kontrol</h2>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <p className="text-xs text-gray-500 mb-1">Sistem tarafından oluşturulan ilan başlığı:</p>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500" />
                
                <p className="text-xs text-gray-500 mb-1">Açıklama (İsterseniz düzenleyebilirsiniz):</p>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              <div className="flex justify-between items-center px-2">
                <p className="text-2xl font-bold text-emerald-600">{price} ₺</p>
                <p className="text-sm text-gray-500">{city}, {district}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition">
                Geri
              </button>
            )}
            {step < 5 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canGoNext()}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition disabled:opacity-50">
                Devam Et
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200">
                {loading ? 'Yayınlanıyor...' : 'İlanı Yayınla'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
