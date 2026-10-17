'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Report {
  id: string; reason: string; status: string; createdAt: string;
  message: { content: string } | null;
  reporter: { username: string };
  reportedSession: { username: string } | null;
  room: { name: string; slug: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, [page, statusFilter]);

  async function fetchReports() {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/admin/reports?page=${page}&status=${statusFilter}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports); setTotal(data.total); setPages(data.pages);
    }
    setLoading(false);
  }

  async function updateStatus(reportId: string, status: string) {
    const token = localStorage.getItem('admin_token');
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reportId, status }),
    });
    fetchReports();
  }

  const statusOptions = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
  const statusVariants: Record<string, 'yellow' | 'blue' | 'green' | 'default'> = {
    PENDING: 'yellow', REVIEWING: 'blue', RESOLVED: 'green', DISMISSED: 'default',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Reports <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
        <div className="flex gap-2">
          {statusOptions.map((s) => (
            <button key={s}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                statusFilter === s ? 'bg-accent-600 text-white border-accent-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >{s}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Reporter', 'Reported', 'Room', 'Reason', 'Message', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{r.reporter.username}</td>
                  <td className="px-4 py-3 text-gray-700">{r.reportedSession?.username || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.room.name}</td>
                  <td className="px-4 py-3"><Badge>{r.reason.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.message?.content || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariants[r.status] || 'default'}>{r.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, 'REVIEWING')}>Review</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, 'DISMISSED')}>Dismiss</Button>
                        </>
                      )}
                      {r.status === 'REVIEWING' && (
                        <Button size="sm" onClick={() => updateStatus(r.id, 'RESOLVED')}>Resolve</Button>
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
    </div>
  );
}
