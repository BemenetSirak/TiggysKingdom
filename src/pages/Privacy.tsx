import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div style={{ minHeight: '70vh', background: 'var(--cream)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--cream-dark) 0%, var(--gold-pale) 100%)', padding: '3rem 1.25rem', textAlign: 'center', borderBottom: '2px solid var(--cream-border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <img src="/tiggy.png" alt="Tiggy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--maroon)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--maroon)', lineHeight: 1.1, textAlign: 'left' }}>
            Tiggy's<br /><span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--gold)', letterSpacing: '0.08em' }}>KINGDOM</span>
          </span>
        </div>
        <h1 style={{ color: 'var(--maroon)', margin: 0, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Privacy Policy</h1>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '2rem' }}>
          Last updated: {new Date().getFullYear()}
        </p>

        {[
          {
            title: '1. Information We Collect',
            body: `When you create an account, we collect your name and email address. When you make a purchase, payment details are handled securely by Stripe — we never store your card information. We also collect basic usage data (pages visited, videos watched) to improve the Service.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `We use your information to: provide and improve the Service; send order confirmations and account updates; send our newsletter (only with your consent); and respond to your support requests. We do not sell or rent your personal data to third parties.`,
          },
          {
            title: '3. Children\'s Privacy (COPPA)',
            body: `Tiggy's Kingdom is designed for families. We do not knowingly collect personal information from children under 13 without verifiable parental consent. If you believe a child has provided us with personal information without consent, please contact us and we will delete it promptly.`,
          },
          {
            title: '4. Cookies & Local Storage',
            body: `We use browser local storage to save your session, cart contents, and watch history. We use essential cookies to keep you signed in. We do not use advertising or tracking cookies. You can clear local storage at any time through your browser settings.`,
          },
          {
            title: '5. Data Sharing',
            body: `We share your data only with trusted service providers necessary to operate the Service: Stripe (payment processing), Supabase (database hosting), and email delivery services. Each provider is bound by their own privacy policy and data protection agreements.`,
          },
          {
            title: '6. Data Retention',
            body: `We retain your account data for as long as your account is active. Order records are kept for 7 years for legal compliance. You may request deletion of your account and associated data at any time by contacting us.`,
          },
          {
            title: '7. Your Rights',
            body: `You have the right to access, correct, or delete your personal data. You may unsubscribe from our newsletter at any time using the link in any email. To exercise any of these rights, contact us at hello@tiggyskingdom.com.`,
          },
          {
            title: '8. Security',
            body: `We use industry-standard security measures to protect your data, including encrypted connections (HTTPS) and secure cloud infrastructure. No method of transmission over the internet is 100% secure, but we take all reasonable precautions.`,
          },
          {
            title: '9. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a prominent notice on the Service. Continued use after changes constitutes acceptance.`,
          },
          {
            title: '10. Contact Us',
            body: `For privacy-related questions or requests, please email us at hello@tiggyskingdom.com. We will respond within 5 business days.`,
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--maroon)', fontSize: '1.1rem', margin: '0 0 0.5rem' }}>{section.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.8, margin: 0 }}>{section.body}</p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--cream-border)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/terms" style={{ color: 'var(--gold)', fontWeight: 700 }}>Terms of Service →</Link>
          <Link to="/" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
