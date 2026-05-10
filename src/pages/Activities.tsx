import { useState } from 'react';

const AGE_FILTERS: string[] = ['All Ages', 'Ages 3-5', 'Ages 6-9', 'Ages 9-12'];

interface ActivityItem {
  title: string;
  ages: string;
  downloads: number;
}

interface ActivityCategory {
  id: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  count: number;
  items: ActivityItem[];
}

const ACTIVITY_CATEGORIES = [
  {
    id: 'coloring',
    icon: '🎨',
    title: 'Coloring Pages',
    desc: 'Beautifully illustrated scenes from Bible stories and saint lives — print and color at home.',
    color: '#3B82F6',
    count: 24,
    items: [
      { title: "The Good Shepherd", ages: '3-8', downloads: 1240 },
      { title: "Noah's Ark Adventure", ages: '4-10', downloads: 890 },
      { title: "Saint Yared's Song", ages: '5-12', downloads: 567 },
    ],
  },
  {
    id: 'crafts',
    icon: '✂️',
    title: 'Crafts & Projects',
    desc: 'Hands-on projects to bring faith to life — from cross-making to saint crowns.',
    color: '#F97316',
    count: 12,
    items: [
      { title: "Paper Cross Craft", ages: '5-10', downloads: 432 },
      { title: "Saint Crown Headband", ages: '4-9', downloads: 318 },
      { title: "Prayer Beads Bracelet", ages: '7-12', downloads: 275 },
    ],
  },
  {
    id: 'worksheets',
    icon: '📝',
    title: 'Worksheets',
    desc: 'Learning sheets covering scripture, saints, fasting seasons, and Orthodox traditions.',
    color: '#7C3AED',
    count: 18,
    items: [
      { title: "The Lord's Prayer Fill-In", ages: '5-8', downloads: 695 },
      { title: "12 Apostles Name Matching", ages: '6-10', downloads: 512 },
      { title: "Advent Calendar Activity", ages: '4-12', downloads: 883 },
    ],
  },
  {
    id: 'puzzles',
    icon: '🧩',
    title: 'Puzzles & Games',
    desc: 'Word searches, crosswords, and memory games with Orthodox Christian themes.',
    color: '#22C55E',
    count: 10,
    items: [
      { title: "Saints Word Search", ages: '6-12', downloads: 447 },
      { title: "Scripture Memory Match", ages: '5-10', downloads: 334 },
      { title: "Fasting Foods Crossword", ages: '8-12', downloads: 221 },
    ],
  },
  {
    id: 'prayer',
    icon: '🙏',
    title: 'Prayer Cards',
    desc: 'Printable prayer cards and daily devotionals designed for children.',
    color: '#C9922A',
    count: 15,
    items: [
      { title: "Morning Prayer Card", ages: '3-12', downloads: 1520 },
      { title: "Bedtime Blessing", ages: '3-8', downloads: 1103 },
      { title: "Mealtime Grace", ages: '3-12', downloads: 988 },
    ],
  },
  {
    id: 'music',
    icon: '🎵',
    title: 'Songs & Hymns',
    desc: 'Lyrics sheets and sing-along guides for beloved Orthodox children\'s hymns.',
    color: '#EF4444',
    count: 8,
    items: [
      { title: "Trisagion for Little Ones", ages: '3-10', downloads: 765 },
      { title: "Psalm 23 Song Sheet", ages: '5-12', downloads: 543 },
      { title: "Advent Hymns Booklet", ages: '4-12', downloads: 401 },
    ],
  },
];

function ActivityCard({ cat, onDownload }: { cat: ActivityCategory; onDownload: (title: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        border: `2px solid ${open ? cat.color : 'transparent'}`,
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: open ? '1.25rem' : 0 }}>
        <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
          {cat.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
              {cat.title}
            </h3>
            <span style={{ background: `${cat.color}18`, color: cat.color, borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {cat.count} items
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>
            {cat.desc}
          </p>
        </div>
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '0.5rem', border: `1.5px solid ${cat.color}`, borderRadius: '0.5rem',
          background: open ? cat.color : 'transparent', color: open ? 'white' : cat.color,
          fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {open ? '▲ Close' : '▼ Browse Activities'}
      </button>

      {open && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {cat.items.map(item => (
            <div key={item.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--cream)', borderRadius: '0.75rem', gap: '0.75rem' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.title}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Ages {item.ages} · {item.downloads.toLocaleString()} downloads
                </p>
              </div>
              <button
                onClick={() => onDownload(item.title)}
                style={{
                  background: cat.color, color: 'white', border: 'none', borderRadius: '0.5rem',
                  padding: '0.4rem 0.875rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer',
                  flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                ↓ Free
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Activities() {
  const [ageFilter, setAgeFilter] = useState('All Ages');

  const handleDownload = (title: string) => {
    // In production: link to actual PDF download. For now, show a toast-like alert.
    alert(`"${title}" would download here. PDFs coming soon!`);
  };

  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #7C3AED 100%)', padding: '3.5rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>
          ✏️ Learn Through Play
        </p>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          Free Activities & Printables
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, margin: '0 0 1.5rem' }}>
          Coloring pages, worksheets, crafts & more — all 100% free to download
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['87+', 'Free Downloads'], ['6', 'Categories'], ['All Ages', 'Covered']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.75rem', lineHeight: 1 }}>{v}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '0.8rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Age filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {AGE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setAgeFilter(f)}
              style={{
                padding: '0.45rem 1.1rem', borderRadius: '9999px', border: 'none',
                fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                background: ageFilter === f ? '#7C3AED' : 'white',
                color: ageFilter === f ? 'white' : 'var(--text-secondary)',
                boxShadow: ageFilter === f ? '0 2px 8px rgba(124,58,237,0.4)' : '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Activity grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {ACTIVITY_CATEGORIES.map(cat => (
            <ActivityCard key={cat.id} cat={cat} onDownload={handleDownload} />
          ))}
        </div>

        {/* Submit CTA */}
        <div style={{ marginTop: '3rem', background: 'var(--maroon)', borderRadius: '1.5rem', padding: '2.5rem', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✝</div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
            Teachers & Parents
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, margin: '0 0 1.5rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Contribute your own activities to Tiggy's Kingdom and help families around the world grow in faith.
          </p>
          <a href="mailto:hello@tiggyskingdom.com" style={{ background: 'var(--gold)', color: 'white', borderRadius: '9999px', padding: '0.75rem 2rem', fontWeight: 800, fontSize: '1rem', display: 'inline-block' }}>
            Submit an Activity
          </a>
        </div>
      </div>
    </div>
  );
}
