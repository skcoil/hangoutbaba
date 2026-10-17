'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Room {
  id: string; name: string; slug: string; category: string;
  isDefault: boolean; isArchived: boolean; messageCount: number;
  activeUserCount: number; lastActivity: string; createdAt: string;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ room: Room; action: string } | null>(null);
  const [actioning, setActioning] = useState(false);

  useEffect(() => { fetchRooms(); }, [page]);

  async function fetchRooms() {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/admin/rooms?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }

  async function handleAction() {
    if (!confirmModal) return;
    setActioning(true);
    const token = localStorage.getItem('admin_token');
    await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: confirmModal.action, roomId: confirmModal.room.id }),
    });
    setActioning(false); setConfirmModal(null); fetchRooms();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Rooms <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Category', 'Status', 'Messages', 'Active', 'Last Activity', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : rooms.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.category}</td>
                  <td className="px-4 py-3">
                    {r.isArchived ? <Badge variant="yellow">Archived</Badge> : r.isDefault ? <Badge variant="blue">Default</Badge> : <Badge variant="green">Active</Badge>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.messageCount}</td>
                  <td className="px-4 py-3 text-gray-500">{r.activeUserCount}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(r.lastActivity).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary"
                        onClick={() => setConfirmModal({ room: r, action: r.isArchived ? 'unarchive' : 'archive' })}>
                        {r.isArchived ? 'Restore' : 'Archive'}
                      </Button>
                      {!r.isDefault && (
                        <Button size="sm" variant="danger" onClick={() => setConfirmModal({ room: r, action: 'delete' })}>Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="sm" variant="secondary" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
      <Modal open={!!confirmModal} onClose={() => setConfirmModal(null)}
        title={`${confirmModal?.action === 'delete' ? 'Delete' : confirmModal?.action === 'archive' ? 'Archive' : 'Restore'} ${confirmModal?.room.name}?`}>
        <p className="text-sm text-gray-500 mb-4">
          {confirmModal?.action === 'delete' ? 'This will permanently delete the room and all its messages.' : 'Are you sure?'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmModal(null)}>Cancel</Button>
          <Button variant={confirmModal?.action === 'delete' ? 'danger' : 'primary'} className="flex-1" loading={actioning} onClick={handleAction}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
}
