import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Store, MapPin, Bell, MessageSquare, Heart, User as UserIcon, LogOut, PlusCircle, ShieldCheck, Menu, X, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function Navbar() {
  const { user, signOut, isShopkeeper } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      fetchUnreadMessages()

      const notifChannel = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount()
        })
        .subscribe()

      const msgChannel = supabase
        .channel(`messages_nav:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, () => {
          fetchUnreadMessages()
        })
        .subscribe()

      return () => { 
        supabase.removeChannel(notifChannel)
        supabase.removeChannel(msgChannel)
      }
    }
  }, [user])

  async function fetchUnreadCount() {
    if (!user) return
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    setUnreadCount(count || 0)
  }

  async function fetchUnreadMessages() {
    if (!user) return
    // Since we can't filter by a join easily in count, we fetch unread messages where we are part of conversation but not sender.
    // However, an easier way is to just query messages where sender != user and is_read = false, 
    // and let RLS filter out messages from conversations we're not part of!
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .eq('is_read', false)
    
    setUnreadMessages(count || 0)
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm w-full">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center w-full">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🐢</span>
          <span className="text-xl font-bold text-gray-800 hidden sm:inline-block">TurtleShopping</span>
        </Link>
        {/* Desktop Nav */}
        <div className="hidden md:flex gap-4 items-center">
          <Link to="/turtle-points" className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 text-sm font-medium transition">
            <MapPin className="w-4 h-4" /> Noktalar
          </Link>
          {user ? (
            <>

              {isShopkeeper && (
                <Link to="/esnaf/dashboard" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-bold transition">
                  <Store className="w-4 h-4" /> Esnaf Paneli
                </Link>
              )}
              <Link to="/notifications" className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 text-sm font-medium transition relative">
                <div className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full border border-white min-w-[14px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                Bildirimler
              </Link>
              <Link to="/messages" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition relative">
                <div className="relative flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full border border-white min-w-[14px] text-center">
                      {unreadMessages}
                    </span>
                  )}
                </div>
                Mesajlar
              </Link>
              <div className="relative group py-2">
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 text-sm font-medium transition cursor-pointer">
                  <UserIcon className="w-4 h-4" /> Hesabım
                </button>
                <div className="absolute right-0 top-[100%] w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden">
                  <Link to={`/profile/${user.id}`} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> Profilim
                  </Link>
                  <Link to="/transactions" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> İşlemlerim
                  </Link>
                  <Link to="/my-listings" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Package className="w-4 h-4" /> İlanlarım
                  </Link>
                  <Link to="/favorites" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                    <Heart className="w-4 h-4" /> Favoriler
                  </Link>
                  <button onClick={signOut} className="px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 text-left w-full transition">
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                </div>
              </div>

              <Link to="/create-listing">
                <button className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition shadow-sm ml-2">
                  <PlusCircle className="w-4 h-4" /> İlan Ver
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 text-sm font-medium hover:text-gray-900 transition">
                Giriş Yap
              </Link>
              <Link to="/register">
                <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition shadow-sm">
                  Kayıt Ol
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav Button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="flex flex-col p-4 gap-4 shadow-lg">
            <Link to="/turtle-points" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium">
              <MapPin className="w-5 h-5" /> Noktalar
            </Link>
            {user ? (
              <>

                {isShopkeeper && (
                  <Link to="/esnaf/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">
                    <Store className="w-5 h-5" /> Esnaf Paneli
                  </Link>
                )}
                <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium relative">
                  <Bell className="w-5 h-5" /> Bildirimler
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full ml-1">
                      {unreadCount} yeni
                    </span>
                  )}
                </Link>
                <Link to="/messages" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium">
                  <MessageSquare className="w-5 h-5" /> Mesajlar
                </Link>
                <Link to="/transactions" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium">
                  <ShieldCheck className="w-5 h-5" /> İşlemlerim
                </Link>
                <Link to="/my-listings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium">
                  <Package className="w-5 h-5" /> İlanlarım
                </Link>
                <Link to="/favorites" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium">
                  <Heart className="w-5 h-5" /> Favoriler
                </Link>
                <Link to={`/profile/${user.id}`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-600 font-medium">
                  <UserIcon className="w-5 h-5" /> Profilim
                </Link>
                <Link to="/create-listing" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition shadow-sm mt-2">
                    <PlusCircle className="w-5 h-5" /> İlan Ver
                  </button>
                </Link>
                <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-red-500 font-medium mt-2">
                  <LogOut className="w-5 h-5" /> Çıkış
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center py-2 text-gray-600 font-medium">
                  Giriş Yap
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold">
                    Kayıt Ol
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
