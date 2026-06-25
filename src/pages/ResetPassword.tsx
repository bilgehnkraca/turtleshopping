import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // URL'den access_token kontrolü (Supabase'den gelen linkte hash içinde olur)
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Kullanıcı başarılı bir şekilde kurtarma linkine tıklamış ve kimliği doğrulanmış demektir.
      }
    })
  }, [])

  async function handleUpdatePassword() {
    if (!password || password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-3xl">🔐</span>
          <h2 className="text-2xl font-bold text-gray-800">Yeni Şifre Belirle</h2>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Şifreniz Güncellendi!</h3>
            <p className="text-gray-500 mb-6">Giriş sayfasına yönlendiriliyorsunuz...</p>
            <button 
              onClick={() => navigate('/login')}
              className="text-blue-600 font-medium hover:underline"
            >
              Hemen giriş yap
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Lütfen hesabınız için kullanmak istediğiniz yeni şifreyi girin.
            </p>

            {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <input
              type="password"
              placeholder="Yeni Şifre (En az 6 karakter)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
            />

            <button
              onClick={handleUpdatePassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
