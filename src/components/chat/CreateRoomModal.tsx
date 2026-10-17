'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, category: string, description: string) => Promise<string | null>;
}

const CATEGORIES = [
  { value: 'general', label: 'General', emoji: '💬' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎵' },
  { value: 'social', label: 'Social & Advice', emoji: '❤️' },
  { value: 'fun', label: 'Memes & Fun', emoji: '😂' },
  { value: 'regional', label: 'Regional', emoji: '🌍' },
  { value: 'education', label: 'Study', emoji: '🧠' },
];

export function CreateRoomModal({ open, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a room name');
      return;
    }

    if (trimmed.length < 2) {
      setError('Room name must be at least 2 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const slug = await onCreateRoom(trimmed, category, description.trim());
      if (slug) {
        setName('');
        setDescription('');
        setCategory('general');
        onClose();
        if (typeof window !== 'undefined') {
          window.location.assign(`/room/${slug}`);
        } else {
          router.push(`/room/${slug}`);
        }
      } else {
        setError('Failed to create room. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="✨ Create a New Chatroom">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Room Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Room Name / Topic *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Anime Discussion, Late Night Chitchat..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            maxLength={50}
            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-gray-50/50"
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                  category === cat.value
                    ? 'border-accent-500 bg-accent-50 text-accent-700 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Description <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="Short description of what to talk about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent bg-gray-50/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={loading}
          >
            Create & Join →
          </Button>
        </div>
      </form>
    </Modal>
  );
}
