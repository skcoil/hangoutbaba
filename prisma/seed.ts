import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateSlug } from '../src/lib/titleGenerator';

const prisma = new PrismaClient();

const DEFAULT_ROOMS = [
  { name: 'General', category: 'general', description: 'Talk about anything' },
  { name: 'Random', category: 'general', description: 'Random conversations' },
  { name: 'Technology', category: 'tech', description: 'Tech talks and questions' },
  { name: 'Gaming', category: 'gaming', description: 'Games, tips, and reviews' },
  { name: 'Music', category: 'entertainment', description: 'Music recommendations and talks' },
  { name: 'Movies', category: 'entertainment', description: 'Movie discussions and reviews' },
  { name: 'Relationships', category: 'social', description: 'Relationship advice and chat' },
  { name: 'Study', category: 'education', description: 'Study groups and academic help' },
  { name: 'Travel', category: 'lifestyle', description: 'Travel tips and experiences' },
  { name: 'India', category: 'regional', description: 'India-specific chat' },
  { name: 'Pune', category: 'regional', description: 'Pune locals chat' },
  { name: 'Memes', category: 'fun', description: 'Meme discussions' },
  { name: 'Questions', category: 'general', description: 'Ask anything' },
  { name: 'Advice', category: 'social', description: 'Get advice from strangers' },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  maxMessageLength: '500',
  rateLimitMessages: '10',
  rateLimitWindowMs: '10000',
  maxRoomSize: '500',
  messageRetentionDays: '7',
  sessionTimeoutMinutes: '60',
  ipBlockDurationHours: '24',
  roomInactivityHours: '48',
  maintenanceMode: 'false',
};

async function main() {
  console.log('🌱 Seeding database...');

  // Create default rooms
  for (const room of DEFAULT_ROOMS) {
    await prisma.room.upsert({
      where: { slug: generateSlug(room.name) },
      update: {},
      create: {
        name: room.name,
        slug: generateSlug(room.name),
        description: room.description,
        category: room.category,
        isDefault: true,
      },
    });
  }
  console.log(`✅ Created ${DEFAULT_ROOMS.length} default rooms`);

  // Create default admin settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.adminSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log('✅ Created default settings');

  // Create default admin user
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
    },
  });
  console.log(`✅ Created admin user (username: admin, password: ${adminPassword})`);
  console.log('⚠️  Change the admin password immediately in production!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
