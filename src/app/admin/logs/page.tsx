'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Log {
  id: string; action: string; details: string | null;
  adminId: string | null; createdAt: string;
}

const ACTION_VARIANTS: Record<string, 'red' | 'yellow' | 'green' | 'default'> = {
  BAN_USER: 'red', BLOCK_IP: 'red', DELETE_ROOM: 'red',
  UNBLOCK_IP: 'green', ADMIN_LOGIN: 'green',
  ADMIN_LOGIN_FAILED: 'yellow', UPDATE_SETTINGS: 'default',
  ARCHIVE_ROOM: 'yellow',
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, [page]);

  async function fetchLogs() {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/admin/logs?page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Logs <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Timestamp', 'Action', 'Details'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_VARIANTS[l.action] || 'default'}>
                      {l.action.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.details || '—'}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">No logs yet</td></tr>
              )}
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
    </div>
  );
}
