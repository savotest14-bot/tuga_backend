import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { CONTENT_MODERATION_KEYWORDS } from '../common/seeder/data/violation-keywords.data';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedKeywords() {
  console.log('==================================================');
  console.log('       Content Moderation Wordlist Seeder         ');
  console.log('==================================================');
  console.log(`Found ${CONTENT_MODERATION_KEYWORDS.length} unique deduplicated keywords.`);

  console.log('Purging existing violation keywords...');
  const deleted = await prisma.violationKeyword.deleteMany({});
  console.log(`Removed ${deleted.count} old keyword records.`);

  console.log('Inserting keywords in batches...');
  const chunkSize = 200;
  for (let i = 0; i < CONTENT_MODERATION_KEYWORDS.length; i += chunkSize) {
    const chunk = CONTENT_MODERATION_KEYWORDS.slice(i, i + chunkSize);
    await prisma.violationKeyword.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  const total = await prisma.violationKeyword.count();
  console.log(`✅ Successfully seeded ${total} violation keywords into database!`);
  console.log('==================================================');
}

seedKeywords()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
