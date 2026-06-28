import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../layouts/AdminLayout';
import { TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Pzt', ciro: 4000, komisyon: 200 },
  { name: 'Sal', ciro: 3000, komisyon: 150 },
  { name: 'Çar', ciro: 2000, komisyon: 100 },
  { name: 'Per', ciro: 2780, komisyon: 139 },
  { name: 'Cum', ciro: 1890, komisyon: 94 },
  { name: 'Cmt', ciro: 2390, komisyon: 119 },
  { name: 'Paz', ciro: 3490, komisyon: 174 },
];

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <div className="text-gray-500 font-medium mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-400 mt-2">{subtitle}</div>
    </div>
    <div className={`p-4 rounded-xl ${colorClass}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    listings: 0,
    gmv: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      // Users count
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Listings count
      const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
      
      // GMV & Revenue from transactions
      const { data: txs } = await supabase.from('transactions').select('price, commission').eq('status', 'verified');
      
      let gmv = 0;
      let revenue = 0;
      
      if (txs) {
        txs.forEach(tx => {
          gmv += Number(tx.price || 0);
          revenue += Number(tx.commission || 0);
        });
      }

      setStats({
        users: usersCount || 0,
        listings: listingsCount || 0,
        gmv,
        revenue
      });
    }

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Toplam GMV (Hacim)" 
            value={`₺${stats.gmv.toLocaleString()}`} 
            subtitle="Doğrulanmış işlemlerin toplamı"
            icon={TrendingUp}
            colorClass="bg-blue-600"
          />
          <StatCard 
            title="Net Gelir (Komisyon)" 
            value={`₺${stats.revenue.toLocaleString()}`} 
            subtitle="%5 TurtleGüvence kesintisi"
            icon={DollarSign}
            colorClass="bg-emerald-500"
          />
          <StatCard 
            title="Toplam Kullanıcı" 
            value={stats.users.toLocaleString()} 
            subtitle="Kayıtlı ve aktif hesaplar"
            icon={Users}
            colorClass="bg-purple-500"
          />
          <StatCard 
            title="Aktif İlanlar" 
            value={stats.listings.toLocaleString()} 
            subtitle="Sistemde listelenen ürün"
            icon={ShoppingBag}
            colorClass="bg-orange-500"
          />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-8">Haftalık Finansal Büyüme</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₺${value}`} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="ciro" name="İşlem Hacmi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="komisyon" name="Net Komisyon" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
