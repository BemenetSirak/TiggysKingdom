/**
 * Seed script — populates episodes and products in Supabase.
 * Run with: npx tsx server/seed.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

const episodes = [
  {
    title: 'The Good Shepherd',
    description: 'Tiggy learns about the parable of the Good Shepherd and what it means to be loved and found.',
    video_id: 'dQw4w9WgXcQ',
    age_range: '3-5',
    duration: '8:24',
    sort_order: 1,
    published: true,
  },
  {
    title: "Saint Yared's Gift",
    description: "Follow Tiggy as he discovers the beautiful story of Saint Yared, Ethiopia's legendary composer of sacred music.",
    video_id: 'dQw4w9WgXcQ',
    age_range: '6-8',
    duration: '11:15',
    sort_order: 2,
    published: true,
  },
  {
    title: 'The Holy Cross',
    description: 'Tiggy explores the feast of Meskel — the finding of the True Cross — and why it fills hearts with joy.',
    video_id: 'dQw4w9WgXcQ',
    age_range: '6-8',
    duration: '9:47',
    sort_order: 3,
    published: true,
  },
  {
    title: "Tiggy's First Fast",
    description: 'Tiggy wonders why we fast. A gentle, child-friendly look at the meaning of fasting in the Orthodox faith.',
    video_id: 'dQw4w9WgXcQ',
    age_range: '3-5',
    duration: '7:02',
    sort_order: 4,
    published: true,
  },
  {
    title: 'The Nativity Story',
    description: 'Tiggy retells the birth of Jesus with wonder and reverence, helping young hearts understand Christmas.',
    video_id: 'dQw4w9WgXcQ',
    age_range: 'All',
    duration: '13:30',
    sort_order: 5,
    published: true,
  },
  {
    title: 'Timkat — Epiphany Celebration',
    description: "Join Tiggy at Timkat, the Ethiopian Orthodox celebration of Christ's baptism, full of colour and praise.",
    video_id: 'dQw4w9WgXcQ',
    age_range: '9-12',
    duration: '14:08',
    sort_order: 6,
    published: true,
  },
];

const products = [
  {
    title: "Tiggy's Kingdom: The Good Shepherd",
    author: 'Bemenet Sirak',
    description: 'A beautifully illustrated picture book retelling the parable of the Good Shepherd for young readers.',
    price: 14.99,
    category: 'book',
    badge: 'BESTSELLER',
    active: true,
  },
  {
    title: "Saint Yared's Gift — Children's Edition",
    author: 'Bemenet Sirak',
    description: "The life of Saint Yared brought to life for children with vibrant illustrations and simple text.",
    price: 12.99,
    category: 'book',
    badge: 'NEW',
    active: true,
  },
  {
    title: 'The Holy Cross Colouring Book',
    author: null,
    description: 'Thirty pages of Meskel and cross-themed illustrations for children to colour and explore.',
    price: 7.99,
    category: 'activity',
    badge: null,
    active: true,
  },
  {
    title: "Tiggy's Activity Pack — Fasting & Feasting",
    author: null,
    description: 'Puzzles, colouring pages, and craft ideas centred on the Orthodox fasting calendar.',
    price: 9.99,
    category: 'activity',
    badge: null,
    active: true,
  },
  {
    title: 'Orthodox Saints Card Set (24 cards)',
    author: null,
    description: 'Beautiful illustrated cards featuring twenty-four saints of the Ethiopian Orthodox Church.',
    price: 11.99,
    category: 'gift',
    badge: 'NEW',
    active: true,
  },
  {
    title: "Tiggy's Kingdom Plush Lamb",
    author: null,
    description: "A soft, huggable version of Tiggy — the perfect companion for your child's faith journey.",
    price: 24.99,
    category: 'gift',
    badge: 'POPULAR',
    active: true,
  },
  {
    title: 'The Nativity Story — Board Book',
    author: 'Bemenet Sirak',
    description: 'A sturdy board book perfect for toddlers, retelling the birth of Jesus with Tiggy as guide.',
    price: 8.99,
    category: 'book',
    badge: null,
    active: true,
  },
  {
    title: "Timkat Celebration Kit",
    author: null,
    description: 'Everything you need to celebrate Timkat at home: craft templates, prayers, and a story booklet.',
    price: 16.99,
    category: 'gift',
    badge: null,
    active: true,
  },
];

async function seed() {
  console.log('🌱  Seeding episodes…');
  const { error: epErr } = await supabase.from('episodes').upsert(episodes, { onConflict: 'title' });
  if (epErr) console.error('  Episodes error:', epErr.message);
  else console.log(`  ✓ ${episodes.length} episodes upserted`);

  console.log('🌱  Seeding products…');
  const { error: prErr } = await supabase.from('products').upsert(products, { onConflict: 'title' });
  if (prErr) console.error('  Products error:', prErr.message);
  else console.log(`  ✓ ${products.length} products upserted`);

  console.log('✅  Seed complete.');
}

seed().catch(console.error);
