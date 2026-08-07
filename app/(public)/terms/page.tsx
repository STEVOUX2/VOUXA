import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - VOUXA',
  description: 'Terms of Service and Legal Disclaimer for VOUXA',
};

export default function TermsPage() {
  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#B9B9B9', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Background ambient glow */}
      <div style={{ position: 'relative', height: 0, overflow: 'visible' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse at top, rgba(123, 16, 22, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </div>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>
        
        <div style={{ marginBottom: '64px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 800, 
            color: '#F2F2F0', 
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #FFF 0%, #AAA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: '15px', color: '#7E7E7E' }}>Last Updated: August 3, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', fontSize: '15px', lineHeight: '1.8' }}>
          
          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p>
              By accessing and using VOUXA (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using this Service, you shall be subject to any posted guidelines or rules applicable to such services. 
              Any participation in this Service will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use this Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>2. Description of Service</h2>
            <p>
              VOUXA is a beautifully designed user interface and aggregator. We provide a stylized presentation layer for content discovery. 
              The Service utilizes third-party APIs (such as TMDB) to display metadata, images, and descriptions. VOUXA is solely a structural tool designed to present publicly available information in an enhanced, premium format.
            </p>
          </section>

          <section>
            <div style={{ background: 'rgba(123, 16, 22, 0.05)', border: '1px solid rgba(123, 16, 22, 0.2)', padding: '24px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>3. Copyright and Legal Disclaimer</h2>
              <p style={{ marginBottom: '16px' }}>
                <strong>VOUXA DOES NOT HOST, UPLOAD, OR STORE ANY MEDIA CONTENT.</strong>
              </p>
              <p>
                We absolutely do not host any copyrighted media, video files, or streams on our servers. 
                VOUXA simply acts as a client-side indexing tool and a stylized browser that aggregates links and data provided by third parties. 
                All media content, videos, and images are hosted by non-affiliated third-party platforms. 
                We cannot control the content of third-party servers and do not take responsibility for the media accessed through external links. 
                If you hold the copyright to any material and wish for it to be removed, you must contact the actual third-party host of the media file directly.
              </p>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>4. Intellectual Property</h2>
            <p>
              The VOUXA brand, design language, custom code, and unique UI/UX presentation are the intellectual property of VOUXA. 
              However, movie posters, backdrops, character images, and synopses belong to their respective copyright holders and are provided via public APIs strictly for informational and presentation purposes under fair use.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>5. User Conduct</h2>
            <p>
              You agree to use VOUXA only for lawful purposes. You are prohibited from violating or attempting to violate the security of the Service, 
              including accessing data not intended for you, or logging into a server or account which you are not authorized to access.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>6. Disclaimer of Warranties</h2>
            <p>
              The Service is provided on an "as is" and "as available" basis. VOUXA makes no warranties, expressed or implied, 
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, 
              fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>7. Limitation of Liability</h2>
            <p>
              In no event shall VOUXA or its developers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) 
              arising out of the use or inability to use the materials on VOUXA, even if VOUXA or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ECE8DD', marginBottom: '16px' }}>8. Changes to Terms</h2>
            <p>
              VOUXA reserves the right, at its sole discretion, to modify or replace these Terms at any time. 
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

        </div>

        <div style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <style>{`
            .return-home-btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              color: #ECE8DD;
              text-decoration: none;
              font-size: 14px;
              font-weight: 600;
              background: rgba(255,255,255,0.05);
              padding: 12px 24px;
              border-radius: 999px;
              transition: background 0.2s;
            }
            .return-home-btn:hover {
              background: rgba(255,255,255,0.1);
            }
          `}</style>
          <Link href="/" className="return-home-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Return to Home
          </Link>
        </div>

      </main>
    </div>
  );
}
