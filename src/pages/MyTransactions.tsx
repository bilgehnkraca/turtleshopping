import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Package, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function MyTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rapor Modal State
  const [activeReport, setActiveReport] = useState<any>(null);
  const [activeTx, setActiveTx] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        listings(title, images, price),
        seller_shop:shop_locations!transactions_seller_shop_id_fkey(shop_name, city, full_address),
        buyer_shop:shop_locations!transactions_buyer_shop_id_fkey(shop_name, city, full_address),
        device_reports(*)
      `)
      .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Satıcı Bekleniyor</span>;
      case 'dropped_off_at_seller_shop': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Esnaf İncelemesinde</span>;
      case 'report_created': return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">Rapor Onayınız Bekleniyor</span>;
      case 'report_approved': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Ödendi, Kargoya Verilecek</span>;
      case 'in_transit': return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">Kargoda (Transfer)</span>;
      case 'arrived_at_buyer_shop': return <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold">Teslim Noktasında Bekliyor</span>;
      case 'verified': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Tamamlandı</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">İptal Edildi</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const openReport = (tx: any) => {
    if (tx.device_reports && tx.device_reports.length > 0) {
      setActiveReport(tx.device_reports[0]);
      setActiveTx(tx);
    }
  };

  const handleApproveReport = async () => {
    // Burada kredi kartı formu / ödeme entegrasyonu mocklanıyor
    const confirmPayment = window.confirm(`Ekspertiz raporunu onaylıyorsunuz. ${activeTx.price.toLocaleString('tr-TR')} ₺ tutarındaki ödeme kredi kartınızdan çekilip Escrow havuzuna alınacaktır. Onaylıyor musunuz?`);
    if (!confirmPayment) return;

    const { error } = await supabase.from('transactions').update({ status: 'report_approved' }).eq('id', activeTx.id);
    if (!error) {
      alert('Ödeme başarıyla havuza alındı! Satıcının esnafı ürünü seçtiğiniz noktaya kargolayacak.');
      setActiveReport(null);
      setActiveTx(null);
      fetchTransactions();
    } else {
      console.error(error);
      alert('İşlem sırasında bir hata oluştu: ' + error.message);
    }
  };

  const handleRejectReport = async () => {
    const confirmReject = window.confirm(`Raporu yetersiz buldunuz. İşlemi iptal edip ürünü satıcıya iade etmek istiyor musunuz?`);
    if (!confirmReject) return;

    const { error } = await supabase.from('transactions').update({ status: 'cancelled' }).eq('id', activeTx.id);
    if (!error) {
      alert('İşlem iptal edildi.');
      setActiveReport(null);
      setActiveTx(null);
      fetchTransactions();
    } else {
      console.error(error);
      alert('İptal sırasında bir hata oluştu: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck className="text-emerald-600" size={40} />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Güvenli İşlemlerim</h1>
            <p className="text-gray-500">Alıcı veya satıcı olduğunuz TurtleGüvence işlemlerini buradan takip edebilirsiniz.</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <Package className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz bir işleminiz yok</h2>
            <p className="text-gray-500 mb-6">TurtleGüvence ile güvenli alışverişe hemen başlayabilirsiniz.</p>
            <Link to="/">
              <button className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition">İlanları Keşfet</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {transactions.map((tx) => {
              const isBuyer = tx.buyer_id === user?.id;
              
              return (
                <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6">
                  
                  {/* İlan Foto ve Bilgisi */}
                  <div className="flex gap-4 md:w-1/3">
                    <img 
                      src={tx.listings?.images?.[0] || 'https://via.placeholder.com/150'} 
                      className="w-24 h-24 object-cover rounded-xl bg-gray-100" 
                      alt="Listing" 
                    />
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block ${isBuyer ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {isBuyer ? 'ALICIYIM' : 'SATICIYIM'}
                      </span>
                      <h3 className="font-bold text-gray-900 leading-tight mb-1">{tx.listings?.title}</h3>
                      <p className="text-emerald-600 font-black">{tx.price?.toLocaleString('tr-TR')} ₺</p>
                    </div>
                  </div>

                  {/* Durum ve Kodlar */}
                  <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    <div className="mb-4">
                      {getStatusBadge(tx.status)}
                    </div>
                    
                    {/* Alıcıya ve Satıcıya Göre Farklı Mesajlar / Kodlar */}
                    {isBuyer ? (
                      <div className="space-y-3">
                        {tx.status === 'pending' && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            Satıcının ürünü bir TurtleNokta'ya teslim etmesi bekleniyor. Teslim edildiğinde teknisyen raporu buraya düşecektir.
                          </p>
                        )}
                        {tx.status === 'report_created' && (
                          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-purple-800 text-sm font-bold mb-1">Ekspertiz Raporu Hazır!</p>
                              <p className="text-purple-600 text-xs">Teknisyen cihazı kontrol etti. Lütfen inceleyin.</p>
                            </div>
                            <button onClick={() => openReport(tx)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition shadow-md shadow-purple-200">
                              Raporu İncele ve Öde
                            </button>
                          </div>
                        )}
                        {tx.status === 'arrived_at_buyer_shop' && (
                          <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-teal-800 text-sm font-bold">Ürün Teslim Noktasında!</p>
                              <p className="text-teal-600 text-xs">Teslim almak için esnafa şu kodu gösterin:</p>
                            </div>
                            <span className="text-2xl font-mono font-black text-teal-700 tracking-widest">{tx.pick_up_code}</span>
                          </div>
                        )}
                        {tx.status === 'dropped_off' && (
                          <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-teal-800 text-sm font-bold">Eski Sistem İşlemi</p>
                              <p className="text-teal-600 text-xs">Teslim almak için kodu gösterin:</p>
                            </div>
                            <span className="text-2xl font-mono font-black text-teal-700 tracking-widest">{tx.pick_up_code}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tx.status === 'pending' && (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-amber-800 text-sm font-bold">Ürünü Esnafa Bırakın</p>
                              <p className="text-amber-600 text-xs">Sisteme girmek için esnafa şu kodu verin:</p>
                            </div>
                            <span className="text-2xl font-mono font-black text-amber-700 tracking-widest">{tx.drop_off_code}</span>
                          </div>
                        )}
                        {(tx.status === 'dropped_off_at_seller_shop' || tx.status === 'report_created') && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            Ürünü teslim ettiniz. Alıcının ekspertiz raporunu onaylayıp parayı havuza atması bekleniyor.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RAPOR İNCELEME MODALI */}
      {activeReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-10 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-auto">
            
            {/* Header */}
            <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50 rounded-t-3xl">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> TurtleNokta Ekspertiz Raporu
              </h2>
              <button onClick={() => setActiveReport(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300">
                <XCircle size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8">
              
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 font-bold mb-1">Kozmetik Puanı</p>
                  <p className="text-xs text-gray-400">Teknisyenin dış görünüş değerlendirmesi</p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white ${activeReport.cosmetic_score >= 8 ? 'bg-emerald-500' : activeReport.cosmetic_score >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}>
                  {activeReport.cosmetic_score}/10
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-500 font-bold mb-4">Donanım ve Çalışma Durumu</p>
                {activeReport.functional_status ? (
                  <div className="flex items-center gap-3 text-emerald-700 font-bold">
                    <CheckCircle2 size={24} /> Tüm fonksiyonlar sorunsuz çalışıyor.
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 text-red-700 font-bold mb-2">
                      <AlertCircle size={24} /> Bazı fonksiyonlarda sorun tespit edildi!
                    </div>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                      <b>Çalışmayan Aksamlar:</b> {activeReport.not_working_parts}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 font-bold mb-2">Teknisyen Notu</p>
                <div className="bg-blue-50 text-blue-900 p-4 rounded-xl border border-blue-100 leading-relaxed text-sm">
                  "{activeReport.technician_notes}"
                </div>
              </div>

            </div>

            {/* Footer / Karar */}
            <div className="border-t border-gray-100 p-6 bg-gray-50 rounded-b-3xl flex gap-4">
              <button onClick={handleRejectReport} className="flex-1 py-4 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition">
                Vazgeç & İptal Et
              </button>
              <button onClick={handleApproveReport} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
                Onayla & Ödemeyi Yap
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
