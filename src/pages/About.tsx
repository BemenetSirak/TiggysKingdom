import { Link } from 'react-router-dom';

const CHARACTERS = [
  {
    name: 'Tiggy the Lamb',
    role: 'Your Faithful Guide',
    desc: 'Hello, dear friend! I am Tiggy, and I am so glad you are here. Just like the Good Shepherd loves His lambs, I am here to guide you through wonderful stories about Jesus, the saints, and our beautiful Orthodox faith.',
    traits: ['Gentle & Kind', 'Loves Learning', 'Prayerful Heart'],
    emoji: null,
    image: '/tiggy.png',
    color: '#C9922A',
  },
  {
    name: 'Teacher Zola',
    role: 'The Wise Elder',
    desc: 'Teacher Zola is the elder of the flock — full of wisdom, warmth, and wonderful stories. She has lived through many seasons and loves sharing the deep truths of the faith with the little ones.',
    traits: ['Wise & Warm', 'Patient Teacher', 'Story Keeper'],
    emoji: '🦙',
    color: '#7C3AED',
  },
  {
    name: 'Brother Marcus',
    role: 'The Brave Adventurer',
    desc: 'Brother Marcus is always ready for an adventure! He explores monasteries, climbs mountains, and discovers the hidden beauty of God\'s creation — bringing Tiggy along for every exciting journey.',
    traits: ['Brave & Bold', 'Explorer', 'Faithful Friend'],
    emoji: '🐏',
    color: '#3B82F6',
  },
  {
    name: 'Sister Lily',
    role: 'The Caring Heart',
    desc: 'Sister Lily has the biggest heart in the Kingdom. She tends to the sick, helps the lonely, and shows everyone what it means to love your neighbor just as the Lord commands.',
    traits: ['Compassionate', 'Healing Touch', 'Joyful Spirit'],
    emoji: '🌸',
    color: '#EC4899',
  },
];

const VALUES = [
  { icon: '✝', title: 'Orthodox Faith', desc: 'Rooted in the ancient traditions of Eastern Orthodox Christianity, theologically reviewed by clergy.' },
  { icon: '📖', title: 'Sacred Stories', desc: 'Every story is crafted to introduce children to the lives of saints, the Scriptures, and Church traditions.' },
  { icon: '🎨', title: 'Beautiful Art', desc: 'Stunning illustrations and animations that spark wonder and make the faith come alive for young hearts.' },
  { icon: '👨‍👩‍👧‍👦', title: 'Family First', desc: 'Designed to spark conversations between parents and children — faith grows best in community.' },
  { icon: '🔒', title: 'Safe for Kids', desc: 'Ad-free, screen-time conscious, and carefully crafted with children ages 4-12 in mind.' },
  { icon: '🌍', title: 'Global Community', desc: 'Serving Orthodox families from all traditions worldwide — Coptic, Ethiopian, Greek, Antiochian, and more.' },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: 'var(--gold)', fontSize: '1.1rem', margin: '0 0 0.25rem' }}>Our Story</p>
          <h1 style={{ color: 'var(--maroon)', margin: '0 0 1rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
            About Tiggy's Kingdom
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.8, fontSize: '1.05rem', margin: 0 }}>
            Tiggy's Kingdom is a premier Oriental Orthodox Christian digital platform dedicated to
            teaching children ages 4-12 about the Bible, saints, and Orthodox faith through engaging
            animations, beautiful storybooks, and interactive activities.
          </p>
        </div>
      </section>

      {/* Meet Tiggy */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            {/* Character image */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{
                  width: 260, height: 260, borderRadius: '50%', overflow: 'hidden',
                  margin: '0 auto',
                  border: '4px solid var(--gold)',
                  boxShadow: '0 8px 32px rgba(201,146,42,0.3)',
                }}>
                  <img src="/tiggy.png" alt="Tiggy the Lamb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Halo */}
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  width: 284, height: 284, borderRadius: '50%',
                  border: '2px dashed var(--gold)', opacity: 0.4,
                }} />
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Gentle & Kind', 'Loves Learning', 'Prayerful Heart'].map(t => (
                  <span key={t} style={{ background: 'var(--gold-pale)', color: 'var(--gold-dark)', padding: '0.35rem 0.875rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Text */}
            <div>
              <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', color: 'var(--gold)', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>Meet Your Faithful Friend</p>
              <h2 style={{ color: 'var(--maroon)', margin: '0 0 1.25rem', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>Tiggy the Lamb</h2>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.8, margin: '0 0 1rem' }}>
                Hello, dear friend! I am Tiggy, and I am so glad you are here. Just like the Good Shepherd
                loves His lambs, I am here to guide you through wonderful stories about Jesus, the saints,
                and our beautiful Orthodox faith.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.8, margin: '0 0 1.5rem' }}>
                Together, we will explore ancient churches, learn sacred prayers, discover brave heroes of
                faith, and grow closer to God — all while having joyful adventures!
              </p>
              <Link to="/episodes" className="btn-gold">Start Watching →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Characters */}
      <section style={{ background: 'var(--gold-pale)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
            Meet All the Friends
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 2.5rem' }}>
            A wonderful cast of characters to guide your child's faith journey
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.5rem' }}>
            {CHARACTERS.map(char => (
              <div key={char.name} className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                  background: `${char.color}22`,
                  border: `3px solid ${char.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', fontSize: '2.5rem',
                }}>
                  {char.image
                    ? <img src={char.image} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : char.emoji}
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: char.color, margin: '0 0 0.25rem', letterSpacing: '0.05em' }}>
                  {char.role.toUpperCase()}
                </p>
                <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: 'var(--maroon)', margin: '0 0 0.75rem', fontSize: '1.1rem' }}>
                  {char.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                  {char.desc}
                </p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {char.traits.map(t => (
                    <span key={t} style={{ background: `${char.color}18`, color: char.color, padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section style={{ background: 'var(--cream)', padding: '4rem 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--maroon)', margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}>
            What We Believe In
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 2.5rem' }}>
            Our mission is rooted in these core values
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(107,32,32,0.07)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  {v.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, color: 'var(--maroon)', margin: '0 0 0.35rem', fontSize: '1rem' }}>{v.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--maroon)', padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ color: 'white', margin: '0 0 0.75rem', fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          Ready to Start the Adventure?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, margin: '0 0 2rem' }}>
          Join thousands of families growing in faith together
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/episodes" className="btn-gold">Watch Episodes</Link>
          <Link to="/subscribe" style={{ color: 'white', padding: '0.75rem 1.75rem', borderRadius: '9999px', fontWeight: 800, border: '2px solid rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Join for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
