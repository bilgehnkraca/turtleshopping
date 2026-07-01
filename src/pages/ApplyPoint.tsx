import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Store, MapPin, Phone, User, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export default function ApplyPoint() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    owner_name: '',
    owner_email: '',
    about: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const { error } = await supabase.from('point_applications').insert([formData]);
      
      if (error) throw error;
      
      setStatus('success');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Başvuru gönderilirken bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <ShieldCheck className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Turtle Noktası Olun
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            İşletmenizi TurtleShopping ekosistemine dahil edin. İkinci el alışverişte 
            güven noktası olarak ek gelir elde edin ve müşteri kitlenizi genişletin.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            {status === 'success' ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Turtle Noktası başvurunuz ekibimize başarıyla iletilmiştir. 
                  En kısa sürede değerlendirilip size dönüş yapılacaktır.
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Ana Sayfaya Dön
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">İşletme Adı</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="Örn: Güven İletişim"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Şehir</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="Örn: İstanbul"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Tam Adres</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 text-gray-400" size={20} />
                    <textarea
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none"
                      placeholder="İşletmenizin açık adresi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Yetkili Ad Soyad</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        name="owner_name"
                        required
                        value={formData.owner_name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Telefon</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                        placeholder="05XX XXX XX XX"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="owner_email"
                      required
                      value={formData.owner_email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                      placeholder="İletişim e-posta adresiniz (Sistemde kayıtlı e-posta adresiniz olması önerilir)"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">İşletme Hakkında (Opsiyonel)</label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none"
                    placeholder="Kaç yıldır hizmet veriyorsunuz, uzmanlık alanlarınız vb."
                  />
                </div>

                {status === 'error' && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'submitting' ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
