import { useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface FeastDay {
  day: number;
  name: string;
  note?: string;
  type: string;
  tradition: string;
}

interface FastingPeriod {
  name: string;
  dates: string;
  days: number | string;
  color: string;
  icon: string;
  desc: string;
  tradition: string;
}

interface BadgeInfo {
  label: string;
  bg: string;
  color: string;
}

// Oriental Orthodox feast days (Gregorian calendar dates)
// Based on Ethiopian Orthodox Tewahedo & Coptic Orthodox traditions
const FEAST_DAYS: Record<number, FeastDay[]> = {
  1: [
    { day: 7,  name: 'Genna — Nativity of Our Lord Jesus Christ', note: 'Ethiopian & Coptic Christmas', type: 'great-feast', tradition: 'ethiopian' },
    { day: 17, name: 'St. Anthony the Great, Father of Desert Monasticism', note: 'Founding father of Christian monasticism', type: 'saint', tradition: 'coptic' },
    { day: 19, name: 'Timkat — Holy Theophany (Epiphany)', note: 'Blessing of waters; Ark of the Covenant processions', type: 'great-feast', tradition: 'ethiopian' },
    { day: 20, name: 'Timkat — Second Day of Theophany', note: 'Feast of St. Michael (Ethiopian tradition)', type: 'feast', tradition: 'ethiopian' },
  ],
  2: [
    { day: 2,  name: 'Presentation of Christ at the Temple', note: '40 days after Genna (Jan 7)', type: 'great-feast', tradition: 'both' },
    { day: 8,  name: 'Flight of the Holy Family to Egypt', note: "Holy Family's refuge in Egypt — major Coptic feast", type: 'great-feast', tradition: 'coptic' },
  ],
  3: [
    { day: 2,  name: 'St. Frumentius (Abuna Salama / Kesaté Birhan)', note: 'Apostle of Ethiopia, first Bishop of Aksum', type: 'saint', tradition: 'ethiopian' },
    { day: 7,  name: 'Forty Holy Martyrs of Sebaste', note: 'Commemorated across all Oriental Orthodox churches', type: 'feast', tradition: 'both' },
    { day: 25, name: 'Annunciation of the Holy Theotokos', note: "Lideta le-Mariam — Gabriel's message to the Virgin", type: 'great-feast', tradition: 'both' },
  ],
  4: [
    { day: 25, name: 'St. Mark the Evangelist', note: 'Founder of the Coptic Church; first Pope of Alexandria', type: 'great-feast', tradition: 'coptic' },
  ],
  5: [
    { day: 24, name: 'St. Tekla Haymanot of Ethiopia', note: 'Patron saint of Ethiopia; founded Debre Libanos monastery', type: 'saint', tradition: 'ethiopian' },
    { day: 29, name: 'Feast of the Holy Trinity (Igziabeher)', note: 'Special veneration of the Holy Trinity in Ethiopian tradition', type: 'feast', tradition: 'ethiopian' },
  ],
  6: [
    { day: 2,  name: 'St. Yared — Father of Ethiopian Sacred Music', note: 'Composer of Ge\'ez liturgical chant (Zema); divinely inspired', type: 'saint', tradition: 'ethiopian' },
    { day: 29, name: 'Sts. Peter & Paul, Princes of the Apostles', note: 'Universal feast; end of the Apostles Fast', type: 'feast', tradition: 'both' },
  ],
  7: [
    { day: 20, name: 'Prophet Elijah (Elias) the Tishbite', note: 'The great prophet taken to heaven in a chariot of fire', type: 'saint', tradition: 'both' },
    { day: 22, name: 'St. Mary Magdalene, Equal-to-the-Apostles', note: 'First witness of the Resurrection', type: 'saint', tradition: 'both' },
  ],
  8: [
    { day: 6,  name: 'Transfiguration of Our Lord', note: 'Christ revealed in divine glory on Mt. Tabor', type: 'great-feast', tradition: 'both' },
    { day: 19, name: 'Buhe — Ethiopian Eve of Transfiguration', note: 'Bonfires lit nationwide; children sing the Buhe hymn', type: 'great-feast', tradition: 'ethiopian' },
    { day: 22, name: 'Filseta — Dormition of the Holy Theotokos', note: 'Oriental Orthodox date for the Falling Asleep of the Virgin', type: 'great-feast', tradition: 'both' },
    { day: 29, name: 'Beheading of St. John the Baptist', note: 'Strict fast day commemorating the Prophet and Forerunner', type: 'feast', tradition: 'both' },
  ],
  9: [
    { day: 11, name: 'Enkutatash — Ethiopian New Year (1 Meskerem)', note: 'Start of the Ethiopian year; flowers and song greet the new year', type: 'great-feast', tradition: 'ethiopian' },
    { day: 27, name: 'Meskel — Finding of the True Cross', note: 'The largest street festival in Ethiopia; the Demera bonfire ceremony', type: 'great-feast', tradition: 'ethiopian' },
    { day: 29, name: 'Feast of Archangels Michael & Gabriel', note: 'Monthly feast of the heavenly hosts', type: 'feast', tradition: 'both' },
  ],
  10: [
    { day: 9,  name: 'St. George the Great Martyr (Kidus Giorgis)', note: 'Patron saint of Ethiopia; one of the most beloved saints', type: 'saint', tradition: 'ethiopian' },
    { day: 24, name: 'Abba Gebre Menfes Qiddus (Abbo)', note: 'Ethiopian desert saint; lived 363 years; beloved by animals', type: 'saint', tradition: 'ethiopian' },
  ],
  11: [
    { day: 1,  name: 'Feast of All Saints', note: 'Commemoration of all the righteous who have pleased God', type: 'feast', tradition: 'both' },
    { day: 2,  name: 'Commemoration of All the Departed', note: 'Prayers offered for all who have fallen asleep in Christ', type: 'feast', tradition: 'both' },
    { day: 19, name: 'Monthly Feast of the Holy Virgin Mary', note: 'The 21st of each Coptic month is dedicated to the Theotokos', type: 'feast', tradition: 'coptic' },
    { day: 30, name: 'St. Andrew the First-Called Apostle', note: 'First disciple called by Christ; patron of many Oriental churches', type: 'saint', tradition: 'both' },
  ],
  12: [
    { day: 4,  name: 'St. Barbara the Great Martyr', note: 'Commemorated across all Oriental Orthodox traditions', type: 'saint', tradition: 'both' },
    { day: 7,  name: 'Entry of the Holy Theotokos into the Temple', note: 'The Virgin Mary presented at the Jerusalem Temple at age 3', type: 'great-feast', tradition: 'both' },
    { day: 12, name: 'Beginning of Kiahk / Tsome Gahad (Advent Fast)', note: 'Season of preparation and fasting before the Nativity', type: 'feast', tradition: 'both' },
    { day: 28, name: 'Holy Innocents — Martyrs of Bethlehem', note: 'Children slaughtered by Herod; first martyrs of the Christian faith', type: 'feast', tradition: 'both' },
  ],
};

// Seven fasting seasons of Oriental Orthodox Christianity
const FASTING_PERIODS: FastingPeriod[] = [
  {
    name: 'Tsome Gahad (Advent Fast)',
    dates: 'Dec 12 – Jan 6',
    days: 25,
    color: '#7C3AED',
    icon: '✝',
    desc: 'Preparation for the Nativity of Christ (Genna). The holiest month Kiahk is filled with Marian hymns.',
    tradition: 'Both',
  },
  {
    name: 'Tsome Nineveh (Fast of Nineveh)',
    dates: '3 days, ~2 weeks before Great Lent',
    days: 3,
    color: '#3B82F6',
    icon: '🐟',
    desc: 'In memory of Prophet Jonah and the repentance of the people of Nineveh. Strict 3-day fast.',
    tradition: 'Ethiopian & Coptic',
  },
  {
    name: 'Hudade / Abiy Tsom (Great Lent)',
    dates: '55 days before Fasika (Pascha)',
    days: 55,
    color: '#EF4444',
    icon: '✦',
    desc: 'The most solemn fast — 55 days for Oriental Orthodox (vs. 48 in Eastern). Strict vegan fast daily.',
    tradition: 'Both',
  },
  {
    name: 'Tsome Apostolos (Apostles Fast)',
    dates: 'Monday after Pentecost – Jul 11',
    days: '~2–6 weeks',
    color: '#F97316',
    icon: '🙏',
    desc: 'In honour of the holy apostles who fasted and prayed before going out to preach to the nations.',
    tradition: 'Both',
  },
  {
    name: 'Tsome Filseta (Dormition Fast)',
    dates: 'Aug 1 – Aug 21',
    days: 21,
    color: '#22C55E',
    icon: '🌿',
    desc: 'In honour of the Holy Theotokos. 21 days of prayer culminating in the great feast of Filseta (Aug 22).',
    tradition: 'Ethiopian (14 days Coptic)',
  },
  {
    name: 'Wednesday & Friday Fasts',
    dates: 'Every Wednesday & Friday, year-round',
    days: 104,
    color: '#C9922A',
    icon: '⊕',
    desc: 'Weekly fasts kept by all Oriental Orthodox faithful — Wednesday (betrayal) and Friday (Crucifixion).',
    tradition: 'Both',
  },
];

const TYPE_LABELS: Record<string, BadgeInfo> = {
  'great-feast': { label: 'Great Feast',  bg: '#FEF3C7', color: '#C9922A'  },
  feast:         { label: 'Feast Day',    bg: '#EDE9FE', color: '#7C3AED'  },
  saint:         { label: "Saint's Day",  bg: '#FEE2E2', color: '#6B2020'  },
};

const TRADITION_BADGE: Record<string, BadgeInfo> = {
  ethiopian: { label: 'Ethiopian',         bg: '#DCFCE7', color: '#166534' },
  coptic:    { label: 'Coptic',            bg: '#DBEAFE', color: '#1D4ED8' },
  both:      { label: 'Ethiopian & Coptic', bg: '#F3F4F6', color: '#374151' },
};

// Movable feasts notice
const MOVABLE_FEASTS = [
  { name: 'Tsome Nineveh (Nineveh Fast)', when: '~10 weeks before Pascha' },
  { name: 'Palm Sunday (Hosanna)', when: '1 week before Pascha' },
  { name: 'Holy Week (Himamat)', when: 'Week before Pascha' },
  { name: 'Fasika — Pascha (Easter)', when: 'Variable; usually 1–5 weeks after Western Easter' },
  { name: 'Ascension of Our Lord', when: '40 days after Pascha' },
  { name: 'Pentecost (Peraqlitos)', when: '50 days after Pascha' },
];

export default function Calendar() {
  usePageMeta('Sacred Calendar', 'Oriental Orthodox liturgical calendar — feast days, fasting seasons and celebrations for Ethiopian and Coptic Orthodox traditions.');

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear]   = useState(today.getFullYear());
  const [filter, setFilter] = useState('all');

  const allFeasts = FEAST_DAYS[month] || [];
  const feasts = filter === 'all' ? allFeasts : allFeasts.filter(f => f.tradition === filter || f.tradition === 'both');

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Highlight any feast days that fall today
  const todayFeasts = (FEAST_DAYS[today.getMonth() + 1] || []).filter(f => f.day === today.getDate());

  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '3rem 1.25rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: '0 0 0.75rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>Sacred Calendar</h1>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 auto 1.25rem', maxWidth: 580, lineHeight: 1.6 }}>
          Feast days, fasting seasons, and celebrations of the <strong style={{ color: 'var(--maroon)' }}>Oriental Orthodox</strong> liturgical year —
          following Ethiopian Tewahedo &amp; Coptic Orthodox traditions.
        </p>
        <div style={{ display: 'inline-flex', background: 'var(--cream-border)', borderRadius: '0.75rem', padding: '0.35rem', gap: '0.25rem' }}>
          {[['all','All Traditions'],['ethiopian','Ethiopian'],['coptic','Coptic']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: '0.35rem 0.875rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: filter === val ? 'var(--maroon)' : 'transparent', color: filter === val ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.25rem' }}>

        {/* Today's feast banner */}
        {todayFeasts.length > 0 && month === today.getMonth() + 1 && (
          <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderLeft: '4px solid var(--gold)' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>✦</span>
            <div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 800, color: 'var(--gold-dark)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Commemoration</p>
              {todayFeasts.map((f, i) => (
                <p key={i} style={{ margin: i > 0 ? '0.25rem 0 0' : 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{f.name}</p>
              ))}
            </div>
          </div>
        )}

        {/* Month navigator */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <button onClick={prevMonth} aria-label="Previous month" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--maroon)', fontWeight: 700 }}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--maroon)', fontSize: '1.5rem' }}>{MONTHS[month - 1]}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{year}</span>
            </div>
            <button onClick={nextMonth} aria-label="Next month" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--maroon)', fontWeight: 700 }}>›</button>
          </div>

          {feasts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, padding: '2rem 0' }}>
              {allFeasts.length === 0 ? 'No major feasts recorded for this month.' : 'No feasts match the selected tradition filter.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {feasts.map((feast, i) => {
                const typeInfo = TYPE_LABELS[feast.type] || { label: 'Feast', bg: 'var(--cream)', color: 'var(--maroon)' };
                const tradInfo = TRADITION_BADGE[feast.tradition] || TRADITION_BADGE.both;
                const isToday = feast.day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: typeInfo.bg, borderRadius: '0.875rem', borderLeft: `4px solid ${typeInfo.color}`, outline: isToday ? `2px solid ${typeInfo.color}` : 'none', outlineOffset: 1 }}>
                    <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '1.5rem', color: typeInfo.color, lineHeight: 1 }}>{feast.day}</div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: typeInfo.color, opacity: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{MONTHS[month - 1].slice(0, 3)}</div>
                      {isToday && <div style={{ fontSize: '0.55rem', fontWeight: 900, color: typeInfo.color, marginTop: 2 }}>TODAY</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 0.3rem', fontWeight: 800, color: typeInfo.color, fontSize: '0.95rem', lineHeight: 1.3 }}>{feast.name}</p>
                      {feast.note && <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#6B7280', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4 }}>{feast.note}</p>}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(0,0,0,0.06)', color: typeInfo.color, borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 800 }}>{typeInfo.label}</span>
                        <span style={{ background: tradInfo.bg, color: tradInfo.color, borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 800 }}>{tradInfo.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Movable feasts */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderTop: '4px solid var(--gold)' }}>
          <h3 style={{ margin: '0 0 0.75rem', color: 'var(--maroon)', fontSize: '1rem' }}>Movable Feasts (vary by year)</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            These feasts move each year based on the Oriental Orthodox calculation of Holy Pascha (Fasika), which often differs from both Western and Eastern Orthodox dates.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem' }}>
            {MOVABLE_FEASTS.map(f => (
              <div key={f.name} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', background: 'var(--gold-pale)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 900, marginTop: 2, flexShrink: 0 }}>✦</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem', color: 'var(--maroon)' }}>{f.name}</p>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{f.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fasting seasons */}
        <h3 style={{ color: 'var(--maroon)', margin: '0 0 1rem', fontSize: '1.15rem' }}>The Seven Fasting Seasons</h3>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
          Oriental Orthodox Christians observe more fasting days than any other Christian tradition —
          up to 250 fasting days per year, including Wednesdays, Fridays, and seven major fasting seasons.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {FASTING_PERIODS.map(f => (
            <div key={f.name} className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${f.color}` }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{f.icon}</div>
              <h4 style={{ margin: '0 0 0.25rem', color: f.color, fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.3 }}>{f.name}</h4>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{f.dates}</p>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4 }}>{f.desc}</p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ background: `${f.color}18`, color: f.color, borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>
                  {f.days} {typeof f.days === 'number' ? 'days' : ''}
                </span>
                <span style={{ background: '#F3F4F6', color: '#374151', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>
                  {f.tradition}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <h4 style={{ margin: '0 0 0.875rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</h4>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
            {Object.entries(TYPE_LABELS).map(([, val]) => (
              <div key={val.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 14, height: 14, borderRadius: '3px', background: val.color }} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{val.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--cream-border)' }}>
            {Object.entries(TRADITION_BADGE).map(([, val]) => (
              <div key={val.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 14, height: 14, borderRadius: '3px', background: val.bg, border: `1px solid ${val.color}` }} />
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{val.label}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '0.875rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.5 }}>
            Note: Dates shown use the Gregorian calendar. Ethiopian Orthodox uses the Ge'ez calendar (roughly 7–8 years behind Gregorian).
            The Ethiopian New Year (Enkutatash) begins on Sep 11 (Sep 12 in Gregorian leap years).
          </p>
        </div>
      </div>
    </div>
  );
}
