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
      .select('*, listings(title, price)')
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

  async function sendMessage() {
    if (!newMessage.trim() || !currentUser) return
    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: currentUser,
      content: newMessage.trim(),
    })
    setNewMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-blue-600 text-sm">← Ana Sayfa</Link>
          {conversation?.listings && (
            <div className="flex-1">
              <p className="font-medium text-gray-800 text-sm truncate">{conversation.listings.title}</p>
              <p className="text-xs text-blue-600">{conversation.listings.price?.toLocaleString('tr-TR')} ₺</p>
            </div>
          )}
        </div>
      </nav>

      {/* Mesajlar */}
      <div className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 py-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex mb-3 ${msg.sender_id === currentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
              msg.sender_id === currentUser
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Mesaj gönder */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Mesaj yaz..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={sendMessage}
            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition">
            Gönder
          </button>
        </div>
      </div>
    </div>
  )
}