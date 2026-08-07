export default function Loading() {
  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(123,16,22,0.2)', borderTop: '2px solid #7B1016', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: '#4E4E4E', fontFamily: 'Inter, sans-serif', fontSize: '13px', letterSpacing: '0.06em' }}>LOADING</span>
      </div>
    </div>
  );
}
