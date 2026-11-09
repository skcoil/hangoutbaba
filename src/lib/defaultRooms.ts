import { RoomData } from '@/types';

export const DEFAULT_ROOMS: RoomData[] = [
  { id: 'def-general', slug: 'general', name: 'General', category: 'general', description: 'Talk about anything', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-random', slug: 'random', name: 'Random', category: 'general', description: 'Random conversations', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-tech', slug: 'technology', name: 'Technology', category: 'tech', description: 'Tech talks and questions', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-gaming', slug: 'gaming', name: 'Gaming', category: 'gaming', description: 'Games, tips, and reviews', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-music', slug: 'music', name: 'Music', category: 'entertainment', description: 'Music recommendations and talks', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-movies', slug: 'movies', name: 'Movies', category: 'entertainment', description: 'Movie discussions and reviews', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-relationships', slug: 'relationships', name: 'Relationships', category: 'social', description: 'Relationship advice and chat', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-study', slug: 'study', name: 'Study', category: 'education', description: 'Study groups and academic help', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-travel', slug: 'travel', name: 'Travel', category: 'lifestyle', description: 'Travel tips and experiences', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-india', slug: 'india', name: 'India', category: 'regional', description: 'India-specific chat', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-pune', slug: 'pune', name: 'Pune', category: 'regional', description: 'Pune locals chat', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-memes', slug: 'memes', name: 'Memes', category: 'fun', description: 'Meme discussions', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-questions', slug: 'questions', name: 'Questions', category: 'general', description: 'Ask anything', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
  { id: 'def-advice', slug: 'advice', name: 'Advice', category: 'social', description: 'Get advice from strangers', isDefault: true, activeUserCount: 0, createdAt: new Date(0).toISOString() },
];

export function getRoomBySlug(slug: string): RoomData | undefined {
  return DEFAULT_ROOMS.find((r) => r.slug === slug);
}
