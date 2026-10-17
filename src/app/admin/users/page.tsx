'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface Session {
  id: string; username: string; createdAt: string; lastSeen: string;
  status: string; messageCount: number; isBanned: boolean;
  currentRoom: { name: string; slug: string } | null;
}

export default function AdminUsersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [banModal, setBanModal] = useState<Session | null>(null);
  const [banReason, setBanReason] = useState('');
  const [actioning, setActioning] = useState(false);

  useEffect(() => { fetchSessions(); }, [page, search]);

  async function fetchSessions() {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }

  async function handleBan() {
    if (!banModal) return;
    setActioning(true);
    const token = localStorage.getItem('admin_token');
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: banModal.isBanned ? 'unban' : 'ban', sessionId: banModal.id, reason: banReason }),
    });
    setActioning(false); setBanModal(null); fetchSessions();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
        <div className="w-64">
          <Input placeholder="Search username..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Username', 'Status', 'Messages', 'Room', 'Last Seen', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : sessions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.username}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.isBanned ? 'red' : s.status === 'ACTIVE' ? 'green' : 'default'}>
                      {s.isBanned ? 'Banned' : s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.messageCount}</td>
                  <td className="px-4 py-3 text-gray-500">{s.currentRoom?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(s.lastSeen).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={s.isBanned ? 'secondary' : 'danger'}
                      onClick={() => { setBanModal(s); setBanReason(''); }}
                    >
                      {s.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="sm" variant="secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal open={!!banModal} onClose={() => setBanModal(null)} title={banModal?.isBanned ? `Unban ${banModal?.username}` : `Ban ${banModal?.username}`}>
        {!banModal?.isBanned && (
          <div className="mb-4">
            <Input label="Reason" placeholder="Reason for ban" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          </div>
        )}
        <p className="text-sm text-gray-500 mb-4">
          {banModal?.isBanned ? 'This will restore access for this session.' : 'This will ban the session and block their IP temporarily.'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setBanModal(null)}>Cancel</Button>
          <Button variant={banModal?.isBanned ? 'primary' : 'danger'} className="flex-1" loading={actioning} onClick={handleBan}>
            {banModal?.isBanned ? 'Unban' : 'Ban'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
