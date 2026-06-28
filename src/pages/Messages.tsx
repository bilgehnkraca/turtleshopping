import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Messages() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  async function fetchConversations(userId: string) {
    const { data } = await supabase
      .from('conversations')
      .select('*, listings(title, price, images), buyer:profiles!conversations_buyer_id_fkey(username, full_name), seller:profiles!conversations_seller_id_fkey(username, full_name)')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    setConversations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/login'); return }
      setCurrentUser(data.user.id)
      fetchConversations(data.user.id)
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
  <Link to="/" className="text-2xl font-bold text-blue-600">🐢 TurtleShopping</Link>
  <Link to="/" className="text-blue-600 text-sm hover:underline">← Ana Sayfa</Link>
</div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mesajlar</h2>

        {conversations.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl opacity-80">💬</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz Mesajın Yok</h3>
            <p className="text-gray-500 max-w-sm mb-8">İlgilendiğin ürünler hakkında satıcılara mesaj atarak pazarlık yapabilirsin.</p>
            <Link to="/" className="btn-primary px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-1">
              İlanlara Göz At
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversations.map(conv => {
              const isBuyer = conv.buyer_id === currentUser
              const otherUser = isBuyer ? conv.seller : conv.buyer
              const listing = conv.listings

              return (
                <Link to={`/conversation/${conv.id}`} key={conv.id}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">
                    {listing?.images?.[0] ? (
                      <img src={listing.images[0]} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{listing?.title}</p>
                      <p className="text-blue-600 text-sm font-bold">{listing?.price?.toLocaleString('tr-TR')} ₺</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {otherUser?.full_name || otherUser?.username}
                      </p>
                    </div>
                    <span className="text-gray-300 text-lg">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}