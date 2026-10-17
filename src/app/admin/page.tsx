'use client';
import { useEffect, useState } from 'react';

interface DashboardData {
  onlineUsers: number;
  totalSessions: number;
  activeRooms: number;
  blockedIPs: number;
  pendingReports: number;
  messagesPerMinute: number;
  recentRooms: Array<{ name: string; slug: string; activeUserCount: number; messageCount: number; lastActivity: string }>;
}

function StatCard({ label, value, icon, color = 'text-gray-900' }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
      else setError('Failed to load dashboard');
    } catch { setError('Network error'); }
  }

  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Online Now" value={data.onlineUsers} icon="🟢" color="text-green-600" />
        <StatCard label="Active Rooms" value={data.activeRooms} icon="💬" />
        <StatCard label="Msgs/min" value={data.messagesPerMinute} icon="⚡" />
        <StatCard label="Total Sessions" value={data.totalSessions} icon="👥" />
        <StatCard label="Blocked IPs" value={data.blockedIPs} icon="🚫" color="text-red-600" />
        <StatCard label="Pending Reports" value={data.pendingReports} icon="🚨" color={data.pendingReports > 0 ? 'text-orange-600' : 'text-gray-900'} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recently Active Rooms</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Room</th>
                <th className="text-right py-2 text-gray-500 font-medium">Online</th>
                <th className="text-right py-2 text-gray-500 font-medium">Messages</th>
                <th className="text-right py-2 text-gray-500 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRooms.map((room) => (
                <tr key={room.slug} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 text-gray-800 font-medium">{room.name}</td>
                  <td className="py-2.5 text-right text-green-600">{room.activeUserCount}</td>
                  <td className="py-2.5 text-right text-gray-500">{room.messageCount}</td>
                  <td className="py-2.5 text-right text-gray-400">{new Date(room.lastActivity).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
