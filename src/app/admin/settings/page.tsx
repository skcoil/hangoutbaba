'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Settings {
  maxMessageLength: string;
  rateLimitMessages: string;
  rateLimitWindowMs: string;
  maxRoomSize: string;
  messageRetentionDays: string;
  sessionTimeoutMinutes: string;
  ipBlockDurationHours: string;
  roomInactivityHours: string;
  maintenanceMode: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800">Chat Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Max Message Length (chars)" type="number" value={settings.maxMessageLength || ''}
            onChange={(e) => update('maxMessageLength', e.target.value)} />
          <Input label="Rate Limit (messages)" type="number" value={settings.rateLimitMessages || ''}
            onChange={(e) => update('rateLimitMessages', e.target.value)} />
          <Input label="Rate Limit Window (ms)" type="number" value={settings.rateLimitWindowMs || ''}
            onChange={(e) => update('rateLimitWindowMs', e.target.value)} />
          <Input label="Max Room Size (users)" type="number" value={settings.maxRoomSize || ''}
            onChange={(e) => update('maxRoomSize', e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800">Retention &amp; Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Message Retention (days)" type="number" value={settings.messageRetentionDays || ''}
            onChange={(e) => update('messageRetentionDays', e.target.value)} />
          <Input label="Session Timeout (minutes)" type="number" value={settings.sessionTimeoutMinutes || ''}
            onChange={(e) => update('sessionTimeoutMinutes', e.target.value)} />
          <Input label="Room Inactivity Timeout (hours)" type="number" value={settings.roomInactivityHours || ''}
            onChange={(e) => update('roomInactivityHours', e.target.value)} />
          <Input label="Default IP Block Duration (hours)" type="number" value={settings.ipBlockDurationHours || ''}
            onChange={(e) => update('ipBlockDurationHours', e.target.value)} />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Maintenance Mode</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.maintenanceMode === 'true'}
            onChange={(e) => update('maintenanceMode', String(e.target.checked))}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">Enable maintenance mode (blocks all new sessions)</span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button size="lg" loading={saving} onClick={handleSave}>Save Settings</Button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
      </div>
    </div>
  );
}
