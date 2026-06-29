import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Navbar } from '../components/Navbar'
import type { AppNotification } from '../types'
import { useAuth } from '../hooks/useAuth'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    
    setNotifications(data || [])
    setLoading(false)

    // Mark all as read when viewed
    if (data && data.length > 0) {
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds)
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-6">Bildirimler</h1>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <span className="text-4xl mb-4 block">🔕</span>
            <p className="text-gray-500 font-medium">Hiç bildiriminiz yok.</p>
            <p className="text-gray-400 text-sm mt-1">Favoriye aldığınız ilanların fiyatı düştüğünde burada göreceksiniz.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(notification => (
              <Link 
                to={notification.listing_id ? `/listing/${notification.listing_id}` : '#'} 
                key={notification.id} 
                className={`block bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition ${notification.is_read ? 'border-gray-100' : 'border-emerald-200 bg-emerald-50/30'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {!notification.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{notification.message}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
