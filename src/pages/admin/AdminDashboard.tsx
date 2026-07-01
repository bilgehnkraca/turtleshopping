import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../layouts/AdminLayout';
import { TrendingUp, Users, ShoppingBag, DollarSign, ShieldCheck, Check, X } from 'lucide-react';
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

  const [applications, setApplications] = useState<any[]>([]);
  const [pendingListings, setPendingListings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
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

    async function fetchApplications() {
      const { data: apps } = await supabase.from('point_applications').select('*').eq('status', 'pending');
      if (apps) setApplications(apps);
    }

    async function fetchPendingListings() {
      const { data: listings } = await supabase
        .from('listings')
        .select('*, profiles!listings_user_id_fkey(full_name, email)')
        .eq('status', 'pending');
      if (listings) setPendingListings(listings);
    }

    fetchStats();
    fetchApplications();
    fetchPendingListings();
  }, []);

  const handleApprove = async (app: any) => {
    try {
      // 0. E-posta ile profili bul
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', app.owner_email)
        .single();

      if (profileError || !profile) {
        alert('Bu email ile kayıtlı kullanıcı yok, başvuru sahibi önce siteye üye olmalı.');
        return;
      }

      const profileId = profile.id;
      // 1. Create shop_locations entry
      const { error: shopError } = await supabase.from('shop_locations').insert({
        profile_id: profileId,
        shop_name: app.name,
        city: app.city,
        district: '-', // NOT NULL constraint'e takılmamak için geçici değer
        full_address: app.address,
        is_active: true,
        phone: app.phone,
        email: app.owner_email
      });

      if (shopError) throw shopError;

      // 2. Update profile role
      const { error: roleError } = await supabase.from('profiles').update({ role: 'shopkeeper' }).eq('id', profileId);
      if (roleError) throw roleError;

      // 3. Mark application as approved
      const { error: appError } = await supabase.from('point_applications').update({ status: 'approved' }).eq('id', app.id);
      if (appError) throw appError;

      setApplications(applications.filter(a => a.id !== app.id));
      alert('Başvuru onaylandı ve esnaf kaydı oluşturuldu.');
    } catch (error: any) {
      alert('Hata: ' + error.message);
    }
  };

  const handleReject = async (appId: string) => {
    if (!confirm('Reddetmek istediğinize emin misiniz?')) return;
    await supabase.from('point_applications').update({ status: 'rejected' }).eq('id', appId);
    setApplications(applications.filter(a => a.id !== appId));
  };

  const handleApproveListing = async (listingId: string, userId: string) => {
    try {
      await supabase.from('listings').update({ status: 'active', rejection_reason: null }).eq('id', listingId);
      await supabase.from('notifications').insert({
        user_id: userId,
        listing_id: listingId,
        title: 'İlanınız Onaylandı! 🎉',
        message: 'İlanınız yöneticilerimiz tarafından onaylandı ve yayına alındı.'
      });
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      alert('İlan başarıyla onaylandı.');
    } catch (e: any) { alert(e.message); }
  };

  const handleRejectListing = async (listingId: string, userId: string) => {
    const reason = prompt('Reddetme sebebini girin (İlan sahibine bildirilecektir):');
    if (!reason) return;
    
    try {
      await supabase.from('listings').update({ status: 'rejected', rejection_reason: reason }).eq('id', listingId);
      await supabase.from('notifications').insert({
        user_id: userId,
        listing_id: listingId,
        title: 'İlanınız Reddedildi ❌',
        message: `İlanınız yayın kurallarımıza uymadığı için reddedildi. Sebep: ${reason}`
      });
      setPendingListings(prev => prev.filter(l => l.id !== listingId));
      alert('İlan reddedildi ve kullanıcıya bildirim gönderildi.');
    } catch (e: any) { alert(e.message); }
  };

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
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-emerald-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Bekleyen Esnaf Başvuruları</h3>
          </div>
          
          {applications.length === 0 ? (
            <div className="text-gray-500 text-center py-8">Bekleyen başvuru bulunmamaktadır.</div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{app.name}</h4>
                    <p className="text-gray-600 text-sm mt-1">{app.city} - {app.address}</p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      <span>👤 {app.owner_name}</span>
                      <span>📞 {app.phone}</span>
                      <span>✉️ {app.owner_email}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove(app)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                      >
                        <Check size={16} /> Onayla
                      </button>
                      <button 
                        onClick={() => handleReject(app.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                      >
                        <X size={16} /> Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="text-orange-500" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Bekleyen İlan Onayları</h3>
          </div>
          
          {pendingListings.length === 0 ? (
            <div className="text-gray-500 text-center py-8">Onay bekleyen ilan bulunmamaktadır.</div>
          ) : (
            <div className="space-y-4">
              {pendingListings.map(listing => (
                <div key={listing.id} className="border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex gap-4 items-center">
                    {listing.images && listing.images.length > 0 && (
                       <img src={listing.images[0]} alt="listing" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{listing.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{listing.price} ₺ • {listing.city}</p>
                      <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        <span>👤 {listing.profiles?.full_name}</span>
                        <span>✉️ {listing.profiles?.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproveListing(listing.id, listing.user_id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                      >
                        <Check size={16} /> Onayla
                      </button>
                      <button 
                        onClick={() => handleRejectListing(listing.id, listing.user_id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                      >
                        <X size={16} /> Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
