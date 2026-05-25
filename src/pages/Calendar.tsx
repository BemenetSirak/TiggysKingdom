import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

// ── Shared Oriental Orthodox feast days (tradition === 'both' only) ───────────
// These are the great feasts and saints' days observed across all Oriental
// Orthodox churches (Coptic, Ethiopian, Armenian, Syriac, Malankara).
const SHARED_FEASTS: Record<number, { day: number; name: string; note: string; type: 'great-feast' | 'feast' | 'saint' }[]> = {
  1:  [
    { day: 7,  name: 'Nativity of Our Lord Jesus Christ',     note: 'The birth of Christ — celebrated with fasting broken and great joy', type: 'great-feast' },
    { day: 19, name: 'Holy Theophany (Epiphany)',              note: 'Baptism of Christ; blessing of water across all traditions', type: 'great-feast' },
  ],
  2:  [
    { day: 2,  name: 'Presentation of Christ at the Temple',  note: 'Forty days after the Nativity; Simeon and Anna receive the Lord', type: 'great-feast' },
  ],
  3:  [
    { day: 7,  name: 'Forty Holy Martyrs of Sebaste',         note: 'Forty soldiers who died for Christ — remembered across all traditions', type: 'feast' },
    { day: 25, name: 'Annunciation of the Holy Theotokos',    note: "The Archangel Gabriel's message to the Virgin Mary", type: 'great-feast' },
  ],
  6:  [
    { day: 29, name: 'Sts. Peter & Paul, Princes of the Apostles', note: 'End of the Apostles\' Fast; universal celebration', type: 'feast' },
  ],
  7:  [
    { day: 20, name: 'Prophet Elijah the Tishbite',           note: 'The great prophet taken to heaven in a chariot of fire', type: 'saint' },
    { day: 22, name: 'St. Mary Magdalene, Equal-to-the-Apostles', note: 'First witness of the Resurrection of Christ', type: 'saint' },
  ],
  8:  [
    { day: 6,  name: 'Transfiguration of Our Lord',           note: 'Christ revealed in divine glory on Mount Tabor', type: 'great-feast' },
    { day: 22, name: 'Dormition of the Holy Theotokos',       note: 'The Falling Asleep of the Virgin Mary; Feast of Filseta', type: 'great-feast' },
    { day: 29, name: 'Beheading of St. John the Baptist',     note: 'Strict fast day; the Prophet and Forerunner of Christ', type: 'feast' },
  ],
  9:  [
    { day: 29, name: 'Feast of the Archangels Michael & Gabriel', note: 'Monthly feast of the heavenly hosts', type: 'feast' },
  ],
  11: [
    { day: 1,  name: 'Feast of All Saints',                   note: 'Commemoration of all the righteous who have pleased God', type: 'feast' },
    { day: 2,  name: 'Commemoration of All the Departed',     note: 'Prayers offered for all who have fallen asleep in Christ', type: 'feast' },
    { day: 30, name: 'St. Andrew the First-Called Apostle',   note: 'First disciple called by Christ', type: 'saint' },
  ],
  12: [
    { day: 4,  name: 'St. Barbara the Great Martyr',          note: 'Commemorated across all Oriental Orthodox traditions', type: 'saint' },
    { day: 7,  name: 'Entry of the Holy Theotokos into the Temple', note: 'The Virgin Mary presented at the Jerusalem Temple at age three', type: 'great-feast' },
    { day: 28, name: 'Holy Innocents — Martyrs of Bethlehem', note: 'Children slaughtered by Herod; first martyrs of the faith', type: 'feast' },
  ],
};

const MOVABLE_FEASTS = [
  { name: 'Fast of Nineveh',      when: '~10 weeks before Pascha' },
  { name: 'Palm Sunday',          when: '1 week before Pascha' },
  { name: 'Holy Week',            when: 'Week before Pascha' },
  { name: 'Pascha (Easter)',      when: 'Variable — Oriental Orthodox calculation' },
  { name: 'Ascension of Our Lord', when: '40 days after Pascha' },
  { name: 'Pentecost',            when: '50 days after Pascha' },
];

const TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'great-feast': { bg: '#FEF3C7', color: '#C9922A',  label: 'Great Feast' },
  feast:         { bg: '#EDE9FE', color: '#6D28D9',  label: 'Feast Day'   },
  saint:         { bg: '#FEE2E2', color: '#6B2020',  label: "Saint's Day" },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Default admin-editable prayers stored in localStorage ───────────────────
const PRAYERS_KEY = 'tk_prayers';

export interface Prayer {
  id: string;
  icon: string;
  title: string;
  text: string;
  note: string;
  borderColor: string;
  active?: boolean;
}

const DEFAULT_PRAYERS: Prayer[] = [
  { id: '1', icon: '🌅', title: 'Morning Prayer',      borderColor: '#F97316', text: 'Thank You, God, for this new day. Keep me kind in work and play. Help me love and help me share, and feel You with me everywhere.', note: 'A gentle way to begin the morning with gratitude.' },
  { id: '2', icon: '🌙', title: 'Evening Prayer',       borderColor: '#7C3AED', text: 'Thank You, God, for all today — the friends, the food, the time to play. Watch me as I close my eyes, until the morning sun will rise.', note: 'Perfect for the end of the bedtime routine.' },
  { id: '3', icon: '🍽', title: 'Before Meals',         borderColor: '#22A05A', text: 'Bless this food we\'re going to eat, and bless the hands that made our treat. Thank You, God, for all we share. Amen.', note: 'A short blessing the whole family can say together.' },
  { id: '4', icon: '👼', title: 'To My Guardian Angel', borderColor: '#3B82F6', text: 'Angel sent to be my friend, stay beside me to the end. Guide my steps and keep me near to all that\'s good and all that\'s dear.', note: 'Help little ones feel safe and watched over.' },
];

function getPrayers(): Prayer[] {
  try {
    const stored = localStorage.getItem(PRAYERS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PRAYERS;
  } catch {
    return DEFAULT_PRAYERS;
  }
}

export default function Calendar() {
  usePageMeta('Prayer Corner', 'Prayers for children, an Oriental Orthodox feast calendar, and gentle ways to grow with God every day.');
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear]   = useState(today.getFullYear());
  const [email, setEmail] = useState('');
  const { addToast } = useToast();
  const prayers = getPrayers();

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const feasts = SHARED_FEASTS[month] || [];
  const todayFeasts = (SHARED_FEASTS[today.getMonth() + 1] || []).filter(f => f.day === today.getDate());

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch(`${API}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'prayer-corner' }) });
    } catch { /* silent */ }
    addToast('You\'ll receive weekly feast reminders!', 'success');
    setEmail('');
  };

  const handleDownloadCalendar = () => {
    // Build a simple text calendar and trigger download
    const lines: string[] = ['ORIENTAL ORTHODOX SHARED FEAST CALENDAR', '=========================================', ''];
    MONTHS.forEach((monthName, idx) => {
      const mFeasts = SHARED_FEASTS[idx + 1] || [];
      if (mFeasts.length === 0) return;
      lines.push(`${monthName.toUpperCase()}`);
      lines.push('-'.repeat(monthName.length));
      mFeasts.forEach(f => {
        lines.push(`  ${idx + 1}/${f.day} — ${f.name}`);
        if (f.note) lines.push(`         ${f.note}`);
      });
      lines.push('');
    });
    lines.push('MOVABLE FEASTS (vary by year)');
    lines.push('-----------------------------');
    MOVABLE_FEASTS.forEach(f => lines.push(`  ${f.name} — ${f.when}`));
    lines.push('');
    lines.push('Generated by Tiggy\'s Kingdom · tiggyskingdom.com');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'oriental-orthodox-calendar.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: 'var(--cream)' }}>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="tiggy-float" style={{ width: 130, height: 145, margin: '0 auto 1.25rem' }}>
            <img src="/tiggy-pray.png" alt="Tiggy praying" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(107,32,32,0.18))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1.5px solid var(--cream-border)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            🙏 The Prayer Corner
          </span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0 0 1rem', color: '#1B2A4A', lineHeight: 1.1, fontWeight: 700 }}>
            A quiet place to <span style={{ color: '#3A7A30' }}>grow with God</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.7, margin: 0, fontSize: '1.05rem' }}>
            Simple prayers for little hearts, and a feast-day calendar to walk through the Church year together — one beautiful day at a time.
          </p>
        </div>
      </section>

      {/* ── Prayer quote (dark navy) ── */}
      <section style={{ background: '#1B2A4A', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ maxWidth: 260, margin: '0 auto' }}>
              <img src="/tiggy-pray.png" alt="Tiggy praying" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.4))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
            </div>
          </div>
          <div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: '#5BB8A0', textTransform: 'uppercase', margin: '0 0 1rem' }}>PRAY WITH TIGGY</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', color: 'white', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', margin: '0 0 1.25rem', lineHeight: 1.25 }}>
              "When you pray, Tiggy prays with you."
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.8, fontWeight: 500, margin: 0, fontSize: '1rem' }}>
              Prayer doesn't have to be long or hard. A few gentle words, said with love, are a beautiful gift to God. Here are some little prayers your child can learn by heart and say each day.
            </p>
          </div>
        </div>
      </section>

      {/* ── Prayers to learn by heart ── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>LITTLE PRAYERS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 3rem', color: '#1B2A4A' }}>Prayers to learn by heart</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {prayers.map(p => (
              <div key={p.id} className="card" style={{ padding: '1.75rem', background: 'white', borderTop: `4px solid ${p.borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>{p.icon}</div>
                  <button
                    onClick={() => {
                      const w = window.open('', '_blank', 'width=480,height=520');
                      if (!w) return;
                      w.document.write(`<!DOCTYPE html><html><head><title>${p.title}</title><style>body{font-family:Georgia,serif;padding:2.5rem;max-width:380px;margin:auto;color:#1B2A4A}h2{color:#6B2020;margin-bottom:.5rem;font-size:1.3rem}p.text{font-style:italic;line-height:1.8;color:#333;font-size:1.05rem;border-left:4px solid ${p.borderColor};padding-left:1rem;margin:1.25rem 0}p.note{color:#888;font-size:.85rem}footer{margin-top:2rem;font-size:.75rem;color:#bbb}button{margin-top:1.5rem;padding:.5rem 1.25rem;background:#6B2020;color:white;border:none;border-radius:6px;cursor:pointer;font-size:.9rem}@media print{button{display:none}}</style></head><body><h2>${p.icon} ${p.title}</h2><p class="text">"${p.text}"</p><p class="note">${p.note}</p><footer>Tiggy's Kingdom · tiggyskingdom.com</footer><button onclick="window.print()">🖨 Print</button></body></html>`);
                      w.document.close();
                    }}
                    title="Print prayer"
                    style={{ background: 'none', border: '1px solid var(--cream-border)', borderRadius: '0.4rem', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}
                  >
                    🖨 Print
                  </button>
                </div>
                <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1rem', margin: '0 0 0.75rem', color: '#1B2A4A' }}>{p.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontWeight: 600, margin: '0 0 0.875rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  "{p.text}"
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feast Day Calendar ── */}
      <section style={{ background: '#F5F0E8', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.18em', color: 'var(--gold-dark)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>FOLLOW THE CHURCH YEAR</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', margin: '0 0 0.75rem', color: '#1B2A4A' }}>Feast Day Calendar</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, margin: '0 auto 1.75rem', maxWidth: 480, lineHeight: 1.6 }}>
            The great feasts and beloved saints, all year long. Tap a month to explore.
          </p>

          {/* Month tabs (scrollable) */}
          <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => setMonth(i + 1)} style={{
                padding: '0.4rem 0.875rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                background: month === i + 1 ? '#1B2A4A' : 'white',
                color: month === i + 1 ? 'white' : 'var(--text-secondary)',
                boxShadow: month === i + 1 ? '0 2px 8px rgba(27,42,74,0.25)' : '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 0.15s', flexShrink: 0,
              }}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Today banner */}
          {todayFeasts.length > 0 && month === today.getMonth() + 1 && (
            <div style={{ background: 'var(--gold-pale)', border: '1.5px solid var(--gold)', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>✦</span>
              <div>
                <p style={{ margin: '0 0 0.2rem', fontWeight: 800, color: 'var(--gold-dark)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Commemoration</p>
                {todayFeasts.map((f, i) => <p key={i} style={{ margin: i > 0 ? '0.2rem 0 0' : 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{f.name}</p>)}
              </div>
            </div>
          )}

          {/* Feast list */}
          <div className="card" style={{ padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <button onClick={prevMonth} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#1B2A4A', fontWeight: 700 }}>‹</button>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#1B2A4A', fontSize: '1.35rem' }}>{MONTHS[month - 1]}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{year}</span>
              </div>
              <button onClick={nextMonth} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#1B2A4A', fontWeight: 700 }}>›</button>
            </div>

            {feasts.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, padding: '2rem 0' }}>No major shared feasts recorded for this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {feasts.map((feast, i) => {
                  const info = TYPE_COLORS[feast.type];
                  const isToday = feast.day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: info.bg, borderRadius: '0.875rem', borderLeft: `4px solid ${info.color}`, outline: isToday ? `2px solid ${info.color}` : 'none', outlineOffset: 1 }}>
                      <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.4rem', color: info.color, lineHeight: 1 }}>{feast.day}</div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: info.color, opacity: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{MONTHS[month - 1].slice(0, 3)}</div>
                        {isToday && <div style={{ fontSize: '0.52rem', fontWeight: 900, color: info.color, marginTop: 2 }}>TODAY</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.3rem', fontWeight: 800, color: info.color, fontSize: '0.95rem', lineHeight: 1.3 }}>{feast.name}</p>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#6B7280', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4 }}>{feast.note}</p>
                        <span style={{ background: 'rgba(0,0,0,0.06)', color: info.color, borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 800 }}>{info.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Movable feasts */}
          <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem', background: 'white', borderTop: '4px solid var(--gold)' }}>
            <h4 style={{ margin: '0 0 0.625rem', color: '#1B2A4A', fontSize: '0.95rem' }}>Movable Feasts (vary by year)</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>
              These feasts move each year based on the Oriental Orthodox calculation of Holy Pascha.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {MOVABLE_FEASTS.map(f => (
                <div key={f.name} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'var(--gold-pale)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 900, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.8rem', color: '#1B2A4A' }}>{f.name}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{f.when}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 0.75rem' }}>
              🎁 Want a reminder before each feast?{' '}
              <Link to="/subscribe" style={{ color: 'var(--gold-dark)', fontWeight: 800 }}>Join Kingdom Mail</Link> for weekly feast alerts.
            </p>
            <button
              onClick={handleDownloadCalendar}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1B2A4A', color: 'white', border: 'none', borderRadius: '9999px', padding: '0.75rem 1.75rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
            >
              ↓ Download Calendar
            </button>
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section style={{ background: 'var(--cream)', padding: '5rem 1.25rem' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', background: 'white' }}>
            <div style={{ width: 110, height: 120, margin: '0 auto 1rem', overflow: 'hidden' }}>
              <img src="/tiggy-cheer.png" alt="Tiggy" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 14px rgba(107,32,32,0.18))' }} onError={e => { (e.currentTarget as HTMLImageElement).src = '/tiggy.png'; }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', margin: '0 0 0.75rem', color: '#1B2A4A' }}>Weekly feast reminders 🔔</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.65, margin: '0 0 1.75rem', fontSize: '0.95rem' }}>
              Never miss a feast day. Join Tiggy's Kingdom Mail for a gentle weekly note about the upcoming celebrations of the Church.
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                className="tk-input"
                style={{ flex: 1, minWidth: 220 }}
                required
              />
              <button type="submit" className="btn-maroon" style={{ background: '#3A7A30', whiteSpace: 'nowrap' }}>Send me reminders</button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
