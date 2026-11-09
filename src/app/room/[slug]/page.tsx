import { DEFAULT_ROOMS } from '@/lib/defaultRooms';
import RoomClient from './RoomClient';

export function generateStaticParams() {
  return DEFAULT_ROOMS.map((room) => ({
    slug: room.slug,
  }));
}

export default function Page() {
  return <RoomClient />;
}
