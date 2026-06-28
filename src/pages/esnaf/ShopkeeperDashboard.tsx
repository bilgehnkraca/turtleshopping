import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ShopkeeperLayout from '../../layouts/ShopkeeperLayout';

const data = [
  { time: '08:00', value: 20 },
  { time: '09:00', value: 45 },
  { time: '10:00', value: 35 },
  { time: '11:00', value: 85 },
  { time: '12:00', value: 130 },
  { time: '14:00', value: 90 },
  { time: '16:00', value: 65 },
  { time: '18:00', value: 85 },
  { time: '20:00', value: 40 },
];

const pieData = [
  { name: 'Doğrulandı', value: 72, color: '#10b981' }, // emerald-500
  { name: 'Bekliyor', value: 18, color: '#f59e0b' },   // amber-500
  { name: 'Sorunlu', value: 10, color: '#ef4444' },    // red-500
];

const recentPackages = [
  { id: 'TN98765432', buyer: 'Ayşe Yılmaz', date: '25 Eki 14:30', status: 'verified', statusText: 'Doğrulandı' },
  { id: 'TN98765433', buyer: 'Mehmet Demir', date: '25 Eki 15:15', status: 'pending', statusText: 'Bekliyor' },
  { id: 'TN98765434', buyer: 'Zeynep Kaya', date: '25 Eki 16:40', status: 'verified', statusText: 'Doğrulandı' },
  { id: 'TN98765435', buyer: 'Ali Can', date: '25 Eki 17:05', status: 'incoming', statusText: 'Yolda' },
];

const MetricCard = ({ title, value, subtext, isPositive, trend }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
    <div className="text-gray-500 font-medium mb-4">{title}</div>
    <div className="flex items-end justify-between mt-auto">
      <div className="text-4xl font-bold text-gray-900">{value}</div>
      <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'} font-medium`}>
        <TrendingUp size={16} className={!isPositive ? 'rotate-180' : ''} />
        {trend}
      </div>
    </div>
    <div className="text-sm text-gray-400 mt-2">{subtext}</div>
  </div>
);

export default function ShopkeeperDashboard() {
  return (
    <ShopkeeperLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Gelen Paketler" 
            value="142" 
            subtext="Bugün teslim alınan toplam" 
            isPositive={true} 
            trend="+15%" 
          />
          <MetricCard 
            title="Doğrulanan Ürünler" 
            value="128" 
            subtext="Doğrulama başarı oranı: %90.1" 
            isPositive={true} 
            trend="+8%" 
          />
          <MetricCard 
            title="Bekleyen Ödemeler (Hakediş)" 
            value="₺3,450" 
            subtext="48 İşlemden bekleyen havuz ödemesi" 
            isPositive={true} 
            trend="+12%" 
          />
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Gelen Paket Akışı</h3>
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
            <h3 className="text-lg font-bold text-gray-800 self-start w-full mb-2">Paket Durumu</h3>
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
                    <span className="text-sm font-bold text-gray-800">%{item.value}</span>
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
            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Tümünü Gör</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-100">
                  <th className="font-medium px-6 py-4">Takip No</th>
                  <th className="font-medium px-6 py-4">Alıcı</th>
                  <th className="font-medium px-6 py-4">Geliş Tarihi</th>
                  <th className="font-medium px-6 py-4">Durum</th>
                  <th className="font-medium px-6 py-4">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {recentPackages.map((pkg, i) => (
                  <tr key={pkg.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{pkg.id}</td>
                    <td className="px-6 py-4 text-gray-600">{pkg.buyer}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{pkg.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        pkg.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 
                        pkg.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {pkg.status === 'verified' && <CheckCircle size={14} />}
                        {pkg.status === 'pending' && <Clock size={14} />}
                        {pkg.status === 'incoming' && <Package size={14} />}
                        {pkg.statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {pkg.status === 'pending' ? (
                        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200">
                          Doğrula & Teslim Et
                        </button>
                      ) : (
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Detay
                        </button>
                      )}
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
