import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [conversation, setConversation] = useState<any>(null)
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
  }

  async function sendMessage(text: string = newMessage) {
    if (!text.trim() || !currentUser) return
    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: currentUser,
      content: text.trim(),
    })
    setNewMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <div className={`max-w-xs px-4 py-2.5 text-sm ${
              msg.sender_id === currentUser
                ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm shadow-sm'
                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm'
            }`}>
              {msg.content}
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