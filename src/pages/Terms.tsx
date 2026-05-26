import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '3rem 1.25rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: 0, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Terms of Service</h1>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '2rem' }}>
          Last updated: {new Date().getFullYear()}
        </p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By accessing or using Tiggy's Kingdom ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.`,
          },
          {
            title: '2. Use of the Service',
            body: `Tiggy's Kingdom is an educational platform designed for children ages 4 and above and their families. You agree to use the Service only for lawful purposes and in a manner consistent with our community values of faith, respect, and love.`,
          },
          {
            title: '3. User Accounts',
            body: `You are responsible for maintaining the security of your account credentials. You agree to notify us immediately of any unauthorized use of your account. Guest accounts are temporary and do not retain data between sessions.`,
          },
          {
            title: '4. Content & Intellectual Property',
            body: `All content on the Service — including videos, stories, illustrations, activities, and audio — is the property of Tiggy's Kingdom and is protected by copyright. You may not reproduce, distribute, or create derivative works without written permission.`,
          },
          {
            title: '5. Purchases & Subscriptions',
            body: `All purchases are final unless otherwise stated. Subscription plans renew monthly unless cancelled before the renewal date. Refund requests are handled on a case-by-case basis within our 30-day money-back policy. Pricing is in USD.`,
          },
          {
            title: '6. Children\'s Privacy',
            body: `We are committed to protecting children's privacy. We do not knowingly collect personal data from children under 13 without verifiable parental consent. Parents or guardians are responsible for supervising use of the Service.`,
          },
          {
            title: '7. Disclaimer of Warranties',
            body: `The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free access. We reserve the right to modify, suspend, or discontinue the Service at any time.`,
          },
          {
            title: '8. Limitation of Liability',
            body: `Tiggy's Kingdom shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid in the 12 months prior to the claim.`,
          },
          {
            title: '9. Changes to Terms',
            body: `We may update these Terms at any time. Continued use of the Service after changes constitutes your acceptance of the new terms. We will notify users of material changes via email or in-app notification.`,
          },
          {
            title: '10. Contact Us',
            body: `If you have questions about these Terms, please contact us at hello@tiggyskingdom.com.`,
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--maroon)', fontSize: '1.1rem', margin: '0 0 0.5rem' }}>{section.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.8, margin: 0 }}>{section.body}</p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/privacy" style={{ color: 'var(--gold)', fontWeight: 700 }}>Privacy Policy →</Link>
          <Link to="/" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
