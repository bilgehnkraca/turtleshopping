import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Lütfen e-posta adresinizi girin.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccessMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.')
      setIsResetMode(false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          <span className="text-3xl">🐢</span> TurtleShopping
        </Link>
        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
          {isResetMode ? 'Şifremi Unuttum' : 'Giriş Yap'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isResetMode 
            ? 'Hesabınıza kayıtlı e-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.'
            : 'Devam etmek için e-posta ve şifrenizle giriş yapın.'}
        </p>

        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
        {successMsg && <p className="text-emerald-600 text-sm mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{successMsg}</p>}

        <input
          type="email"
          placeholder="E-posta adresiniz"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
        />
        
        {!isResetMode && (
          <input
            type="password"
            placeholder="Şifreniz"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
          />
        )}

        <button
          onClick={isResetMode ? handleResetPassword : handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 mt-2 shadow-sm">
          {loading 
            ? 'İşleniyor...' 
            : (isResetMode ? 'Sıfırlama Bağlantısı Gönder' : 'Giriş Yap')}
        </button>

        <div className="flex flex-col items-center mt-4 space-y-4">
          <button 
            onClick={() => {
              setIsResetMode(!isResetMode)
              setError('')
              setSuccessMsg('')
            }}
            className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors"
          >
            {isResetMode ? 'Giriş sayfasına dön' : 'Şifremi Unuttum'}
          </button>

          <p className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100 w-full">
            Hesabın yok mu? <Link to="/register" className="text-blue-600 font-medium hover:underline">Kayıt ol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}