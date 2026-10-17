'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface BlockedIP {
  id: string; ipMasked: string; reason: string;
  isPermanent: boolean; expiresAt: string | null; createdAt: string;
}

export default function AdminBlockedPage() {
  const [blocked, setBlocked] = useState<BlockedIP[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newDuration, setNewDuration] = useState('24');
  const [isPermanent, setIsPermanent] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchBlocked(); }, [page]);

  async function fetchBlocked() {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/admin/blocked?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setBlocked(data.blocked); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }

  async function handleAdd() {
    setAdding(true);
    const token = localStorage.getItem('admin_token');
    await fetch('/api/admin/blocked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ip: newIP, reason: newReason, durationHours: parseInt(newDuration), isPermanent }),
    });
    setAdding(false); setAddModal(false); setNewIP(''); setNewReason(''); fetchBlocked();
  }

  async function handleUnblock(id: string) {
    const token = localStorage.getItem('admin_token');
    await fetch('/api/admin/blocked', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    fetchBlocked();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blocked IPs <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
        <Button onClick={() => setAddModal(true)}>+ Block IP</Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['IP (masked)', 'Reason', 'Duration', 'Expires', 'Blocked At', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : blocked.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{b.ipMasked}</td>
                  <td className="px-4 py-3 text-gray-600">{b.reason}</td>
                  <td className="px-4 py-3">
                    <Badge variant={b.isPermanent ? 'red' : 'yellow'}>{b.isPermanent ? 'Permanent' : 'Temporary'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{b.expiresAt ? new Date(b.expiresAt).toLocaleString() : 'Never'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="secondary" onClick={() => handleUnblock(b.id)}>Unblock</Button>
                  </td>
                </tr>
              ))}
              {!loading && blocked.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No blocked IPs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Block IP Address">
        <div className="space-y-4">
          <Input label="IP Address" placeholder="192.168.1.x" value={newIP} onChange={(e) => setNewIP(e.target.value)} />
          <Input label="Reason" placeholder="Spam, abuse, etc." value={newReason} onChange={(e) => setNewReason(e.target.value)} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={isPermanent} onChange={(e) => setIsPermanent(e.target.checked)} className="rounded" />
              Permanent block
            </label>
          </div>
          {!isPermanent && (
            <Input label="Duration (hours)" type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} min="1" />
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={adding} onClick={handleAdd}>Block IP</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
