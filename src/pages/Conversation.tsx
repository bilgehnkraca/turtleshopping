import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [offer, setOffer] = useState<any>(null)
  const [showCounterModal, setShowCounterModal] = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const quickReplies = [
    "Hâlâ satılık mı?",
    "Son fiyat ne olur?",
    "TurtleNokta teslimatına uygun mu?",
    "Nerede görebilirim?"
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/login'); return }
      setCurrentUser(data.user.id)
    })
    fetchConversation()
    fetchMessages()

    const channel = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'offers'
      }, () => {
        if (conversation) fetchOffer(conversation.listing_id, conversation.buyer_id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    if (conversation) {
      fetchOffer(conversation.listing_id, conversation.buyer_id)
    }
  }, [conversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchOffer(listingId: string, buyerId: string) {
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setOffer(data)
  }

  async function fetchConversation() {
    const { data } = await supabase
      .from('conversations')
      .select('*, listings(title, price), buyer:profiles!conversations_buyer_id_fkey(id, username, full_name), seller:profiles!conversations_seller_id_fkey(id, username, full_name)')
      .eq('id', id)
      .single()
    setConversation(data)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    
    setMessages(data || [])

    // Gelen mesajlari okundu isaretle
    if (data && currentUser) {
      const unreadIds = data.filter(m => m.sender_id !== currentUser && !m.is_read).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
      }
    }
  }

  async function sendMessage(text: string = newMessage) {
    if (!text.trim() || !currentUser) return
    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: currentUser,
      content: text.trim(),
    })
    setNewMessage('')
    fetchMessages()
  }

  async function handleAcceptOffer() {
    if (!offer) return
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
    await sendMessage(`🎁 SİSTEM: Karşı taraf ${offer.amount.toLocaleString('tr-TR')} ₺ teklifi kabul etti!`)
    fetchOffer(conversation.listing_id, conversation.buyer_id)
  }

  async function handleRejectOffer() {
    if (!offer) return
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offer.id)
    await sendMessage(`🎁 SİSTEM: Karşı taraf ${offer.amount.toLocaleString('tr-TR')} ₺ teklifi reddetti.`)
    fetchOffer(conversation.listing_id, conversation.buyer_id)
  }

  async function handleCounterOffer() {
    if (!counterAmount || !offer || !conversation?.listings?.price) return
    
    const minAmount = conversation.listings.price * 0.9;
    if (Number(counterAmount) < minAmount) {
      return alert(`Teklifiniz ilan fiyatının %10'undan daha düşük olamaz. Minimum teklif: ${minAmount.toLocaleString('tr-TR')} ₺`);
    }
    
    // Onceki teklifi rejected yapalim (veya pending kalabilir, ama rejected daha temiz)
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offer.id)
    
    // Yeni teklifi olustur
    await supabase.from('offers').insert({
      listing_id: conversation.listing_id,
      buyer_id: conversation.buyer_id,
      seller_id: conversation.seller_id,
      sender_id: currentUser,
      amount: parseInt(counterAmount),
      status: 'pending'
    })

    await sendMessage(`🎁 SİSTEM: Karşı taraf yeni bir teklif sundu: ${parseInt(counterAmount).toLocaleString('tr-TR')} ₺`)
    setShowCounterModal(false)
    setCounterAmount('')
    fetchOffer(conversation.listing_id, conversation.buyer_id)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/messages" className="text-emerald-600 text-sm hover:underline">← Geri</Link>
          {conversation && (
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 text-sm truncate">{conversation.listings?.title}</p>
                <p className="text-xs text-emerald-600 font-bold">{conversation.listings?.price?.toLocaleString('tr-TR')} ₺</p>
              </div>
              <Link to={`/profile/${conversation.buyer_id === currentUser ? conversation.seller?.id : conversation.buyer?.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                {conversation.buyer_id === currentUser 
                  ? (conversation.seller?.full_name || conversation.seller?.username) 
                  : (conversation.buyer?.full_name || conversation.buyer?.username)}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-4">
        
        {offer && offer.status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-blue-800 font-bold text-sm">Aktif Teklif: {offer.amount.toLocaleString('tr-TR')} ₺</p>
              <p className="text-blue-700 text-xs mt-1">
                {currentUser !== offer.sender_id 
                  ? 'Karşı taraf bu fiyatı teklif etti. Kabul ederseniz işlem bu fiyattan başlayacak.' 
                  : 'Teklifiniz karşı tarafın onayını bekliyor.'}
              </p>
            </div>
            {currentUser !== offer.sender_id && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={handleAcceptOffer} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition">Kabul Et</button>
                <button onClick={() => setShowCounterModal(true)} className="flex-1 sm:flex-none bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-bold transition">Karşı Teklif</button>
                <button onClick={handleRejectOffer} className="flex-1 sm:flex-none bg-white text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition">Reddet</button>
              </div>
            )}
          </div>
        )}

        {showCounterModal && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm flex items-center gap-3">
             <input 
               type="number"
               placeholder="Yeni Teklifiniz (₺)"
               value={counterAmount}
               onChange={e => setCounterAmount(e.target.value)}
               className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
             />
             <button onClick={handleCounterOffer} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">Gönder</button>
             <button onClick={() => setShowCounterModal(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">İptal</button>
          </div>
        )}

        {offer && offer.status === 'accepted' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-800 font-bold text-sm">Anlaşılan Fiyat: {offer.amount.toLocaleString('tr-TR')} ₺</p>
              <p className="text-emerald-700 text-xs mt-1">Teklif kabul edildi! İşlemi bu fiyattan başlatabilirsiniz.</p>
            </div>
            {currentUser === conversation?.buyer_id && (
              <Link to={`/listing/${conversation?.listing_id}?offer_id=${offer.id}`} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition text-center text-nowrap">
                Turtle Güvence ile Al
              </Link>
            )}
          </div>
        )}

        {/* Anti-Scam Warning */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 shadow-sm flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
                <p className="text-red-800 font-bold text-sm mb-1">Dikkat: Güvenliğiniz İçin</p>
                <p className="text-red-700 text-xs">
                    Ödemelerinizi her zaman TurtleGüvence sistemi üzerinden yapın. Satıcı sizden direkt IBAN'a para transferi isterse veya WhatsApp'tan görüşmeyi teklif ederse itibar etmeyin.
                </p>
            </div>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex mb-3 ${msg.sender_id === currentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2.5 text-sm flex flex-col ${
              msg.sender_id === currentUser
                ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm shadow-sm'
                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm'
            }`}>
              <span className="leading-relaxed">{msg.content}</span>
              <div className="text-[10px] opacity-70 text-right mt-1 flex justify-end items-center gap-1">
                <span>{new Date(msg.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</span>
                {msg.sender_id === currentUser && (
                  <span className={msg.is_read ? 'text-blue-300 font-bold' : ''}>{msg.is_read ? '✓✓' : '✓'}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Mesaj gönder */}
      <div className="bg-white border-t border-gray-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
            {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {quickReplies.map((reply, i) => (
                        <button key={i} onClick={() => sendMessage(reply)}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-full text-xs font-medium transition">
                            {reply}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex gap-2">
            <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Güvenle mesaj yazın..."
                className="flex-1 px-5 py-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition"
            />
            <button onClick={() => sendMessage()} disabled={!newMessage.trim()}
                className="bg-emerald-600 text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:hover:bg-emerald-600">
                Gönder
            </button>
            </div>
        </div>
      </div>
    </div>
  )
}