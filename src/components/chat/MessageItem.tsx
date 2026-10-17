'use client';
import { useState } from 'react';
import { MessageData } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface MessageItemProps {
  message: MessageData;
  currentSessionId: string;
  onReport: (messageId: string, reason: string) => Promise<void>;
  onDelete: (messageId: string) => void;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'HATE_ABUSE', label: 'Hate / Abuse' },
  { value: 'SEXUAL_CONTENT', label: 'Sexual Content' },
  { value: 'ILLEGAL_CONTENT', label: 'Illegal Content' },
  { value: 'SCAM', label: 'Scam' },
  { value: 'OTHER', label: 'Other' },
];

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function MessageItem({ message, currentSessionId, onReport, onDelete }: MessageItemProps) {
  const isOwn = message.sessionId === currentSessionId;
  const [showActions, setShowActions] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleReport() {
    if (!selectedReason) return;
    setReporting(true);
    await onReport(message.id, selectedReason);
    setReporting(false);
    setReported(true);
    setReportOpen(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div
        className="group flex flex-col gap-0.5 px-4 py-1.5 hover:bg-gray-50/50 transition-colors animate-slide-up"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-baseline gap-2">
          <span className={`text-xs font-semibold ${isOwn ? 'text-accent-600' : 'text-gray-700'}`}>
            {isOwn ? 'You' : message.username}
          </span>
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>

          {/* Action buttons */}
          {showActions && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy"
              >
                {copied ? (
                  <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              {isOwn && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {!isOwn && !reported && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-400 transition-colors"
                  title="Report"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Message">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Why are you reporting this message?</p>
          <div className="grid grid-cols-2 gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedReason(r.value)}
                className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                  selectedReason === r.value
                    ? 'border-accent-500 bg-accent-50 text-accent-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={reporting} disabled={!selectedReason} onClick={handleReport}>
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
