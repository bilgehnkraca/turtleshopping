import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import ShopkeeperLayout from '../../layouts/ShopkeeperLayout';

const MetricCard = ({ title, value, subtext, isPositive, trend }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
    <div className="text-gray-500 font-medium mb-4">{title}</div>
    <div className="flex items-end justify-between mt-auto">
      <div className="text-4xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'} font-medium`}>
          <TrendingUp size={16} className={!isPositive ? 'rotate-180' : ''} />
          {trend}
        </div>
      )}
    </div>
    <div className="text-sm text-gray-400 mt-2">{subtext}</div>
  </div>
);

export default function ShopkeeperDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ incoming: 0, verified: 0, earnings: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [returnCode, setReturnCode] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  async function fetchDashboardData() {
    const { data: shop } = await supabase.from('shop_locations').select('id').eq('profile_id', user?.id).maybeSingle();

    if (shop) {
      const { data: txs } = await supabase
        .from('transactions')
        .select(`*, listings(title), buyer:profiles!transactions_buyer_id_fkey(full_name, username)`)
        .or(`seller_shop_id.eq.${shop.id},buyer_shop_id.eq.${shop.id}`)
        .order('updated_at', { ascending: false });

      if (txs) {
        let incoming = 0;
        let verifiedCount = 0;
        let totalEarnings = 0;

        txs.forEach(tx => {
          if ((tx.buyer_shop_id === shop.id && tx.status !== 'verified') || (tx.seller_shop_id === shop.id && tx.status === 'return_to_seller_pending')) incoming++;
          if (tx.status === 'verified') {
            verifiedCount++;
            const commission = tx.commission || (tx.price * 0.05);
            if (tx.seller_shop_id === shop.id) totalEarnings += commission * 0.3;
            if (tx.buyer_shop_id === shop.id) totalEarnings += commission * 0.3;
          }
        });

        setStats({ incoming, verified: verifiedCount, earnings: totalEarnings });
        setRecentTransactions(txs.slice(0, 5));
      }
    }
  }

  async function handleProcessReturn() {
    if (!returnCode) {
      alert('Lütfen iade kodunu giriniz.');
      return;
    }

    setReturnLoading(true);
    const { data: shop } = await supabase.from('shop_locations').select('id').eq('profile_id', user?.id).maybeSingle();
    
    if (shop) {
      const { data: tx, error: fetchErr } = await supabase
        .from('transactions')
        .select('id')
        .eq('seller_shop_id', shop.id)
        .eq('seller_pickup_code', returnCode.trim().toUpperCase())
        .eq('status', 'return_to_seller_pending')
        .maybeSingle();

      if (fetchErr || !tx) {
        alert('Geçersiz iade kodu veya bu dükkana ait iade bekleyen işlem bulunamadı.');
      } else {
        const { error: updateErr } = await supabase
          .from('transactions')
          .update({ status: 'returned_to_seller', updated_at: new Date().toISOString() })
          .eq('id', tx.id);
        
        if (updateErr) {
          alert('Hata: ' + updateErr.message);
        } else {
          alert('Cihaz başarıyla satıcıya iade edildi. İşlem tamamlandı.');
          setReturnCode('');
          fetchDashboardData();
        }
      }
    }
    setReturnLoading(false);
  }

  // Örnek veriler (Gerçek zamanlı grafik verisi henüz yok)
  const data = [
    { time: '08:00', value: 20 },
    { time: '10:00', value: 35 },
    { time: '12:00', value: 130 },
    { time: '14:00', value: 90 },
    { time: '16:00', value: 65 },
    { time: '18:00', value: 85 },
  ];

  const pieData = [
    { name: 'Doğrulandı', value: stats.verified, color: '#10b981' },
    { name: 'Bekliyor', value: stats.incoming, color: '#f59e0b' },
  ];

  return (
    <ShopkeeperLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Motivasyon Banner'ı */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
           <div>
              <h2 className="text-xl font-bold mb-1">Ekspertiz Yapın, Kazancınızı Artırın! 💰</h2>
              <p className="text-emerald-50 text-sm">Onayladığınız her cihaz işlemi için işlem bedeli üzerinden komisyon kazanırsınız. Bekleyen paketleri hemen inceleyin.</p>
           </div>
           <div className="hidden md:block text-4xl">🛠️</div>
        </div>

        {/* Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Bekleyen Paketler" 
            value={stats.incoming.toString()} 
            subtext="Şu an dükkanda işlem bekleyen" 
            isPositive={true} 
            trend={null} 
          />
          <MetricCard 
            title="Tamamlanan İşlemler" 
            value={stats.verified.toString()} 
            subtext="Tüm zamanlar" 
            isPositive={true} 
            trend={null} 
          />
          <MetricCard 
            title="Toplam Hakediş" 
            value={`₺${stats.earnings.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`} 
            subtext="Tamamlanan işlemlerden kazanılan" 
            isPositive={true} 
            trend={null} 
          />
        </div>

        {/* İade İşlemi Modülü */}
        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-orange-900 mb-1">Satıcı İade İşlemi (İptal Edilen İşlemler)</h3>
            <p className="text-orange-700 text-sm">Satıcı iptal edilen cihazı teslim almaya geldiğinde kodunu buraya girin.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input 
              type="text" 
              placeholder="İADE KODU GİRİN" 
              value={returnCode}
              onChange={(e) => setReturnCode(e.target.value)}
              className="px-4 py-3 border border-orange-200 rounded-xl flex-1 md:w-48 font-mono text-center font-bold text-orange-900 bg-white"
            />
            <button 
              onClick={handleProcessReturn}
              disabled={returnLoading}
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition whitespace-nowrap disabled:opacity-70"
            >
              {returnLoading ? 'İşleniyor...' : 'Teslim Et'}
            </button>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6">İşlem Hacmi (Simülasyon)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-800 self-start w-full mb-2">Dağılım</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between w-full mt-4 px-4">
              {pieData.map(item => (
                <div key={item.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-sm font-bold text-gray-800">{item.value}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paket Listesi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Son İşlemler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-100">
                  <th className="font-medium px-6 py-4">Takip/İşlem No</th>
                  <th className="font-medium px-6 py-4">Ürün / Alıcı</th>
                  <th className="font-medium px-6 py-4">Geliş Tarihi</th>
                  <th className="font-medium px-6 py-4">Durum</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-mono text-gray-600">{tx.logistics_tracking_no || `#${tx.id.substring(0,8)}`}</td>
                    <td className="px-6 py-4 text-gray-800">
                      <div className="font-medium">{tx.listings?.title}</div>
                      <div className="text-xs text-gray-500">{tx.buyer?.full_name || tx.buyer?.username}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(tx.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tx.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        tx.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                        tx.status === 'return_to_seller_pending' ? 'bg-orange-100 text-orange-700' :
                        tx.status === 'returned_to_seller' ? 'bg-gray-200 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.status === 'verified' ? 'Doğrulandı' : 
                         tx.status === 'pending' ? 'Bekliyor' : 
                         tx.status === 'in_transit' ? 'Yolda' : 
                         tx.status === 'return_to_seller_pending' ? 'İade Bekliyor' : 
                         tx.status === 'returned_to_seller' ? 'İade Edildi' : 
                         tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ShopkeeperLayout>
  );
}
