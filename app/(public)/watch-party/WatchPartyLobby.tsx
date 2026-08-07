'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinWatchParty } from '@/app/actions/user';
import { Film, RefreshCw, MessageCircle, Sparkles } from 'lucide-react';

export function WatchPartyLobby({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    setError('');
    const res = await joinWatchParty(joinCode.trim());
    if ('error' in res && res.error) { setError(res.error); setJoining(false); return; }
    if ('party' in res && res.party) router.push(`/watch-party/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Ambient background */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(123,16,22,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{ width: '100%', maxWidth: '600px', position: 'relative', zIndex: 1 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Film size={56} color="#7B1016" style={{ filter: 'drop-shadow(0 0 16px rgba(123,16,22,0.5))' }} />
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#F2F2F0', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            Watch <span style={{ color: '#B1222E' }}>Together</span>
          </h1>
          <p style={{ color: '#7E7E7E', fontSize: '16px', margin: 0, lineHeight: 1.6 }}>
            Start a private movie room, invite friends, and watch in sync — no matter where they are.
          </p>
        </div>

        <style>{`
          .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 48px;
          }
          .join-form {
            display: flex;
            gap: 12px;
          }
          .instruction-text {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid rgba(255,255,255,0.06);
            color: #7E7E7E;
            font-size: 13px;
            text-align: center;
            line-height: 1.6;
          }
          @media (max-width: 600px) {
            .features-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
            }
            .join-form {
              flex-direction: column;
            }
          }
        `}</style>

        {/* Features row */}
        <div className="features-grid">
          {[
            { icon: <RefreshCw size={24} color="#F2F2F0" />, label: 'Synchronized', sub: 'Countdown sync' },
            { icon: <MessageCircle size={24} color="#F2F2F0" />, label: 'Live Chat', sub: 'Real-time messages' },
            { icon: <Sparkles size={24} color="#F2F2F0" />, label: 'Reactions', sub: 'Interactive' },
          ].map(f => (
            <div key={f.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', textAlign: 'center', transition: 'all 0.3s' }} className="hover:bg-white/5 hover:-translate-y-1">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{f.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F2F2F0', marginBottom: '2px' }}>{f.label}</div>
              <div style={{ fontSize: '11px', color: '#7E7E7E' }}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Join Room */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#F2F2F0', marginBottom: '20px' }}>Join an Existing Room</h2>
          <form onSubmit={handleJoin} className="join-form">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER ROOM CODE (E.G. ABC123)"
              maxLength={6}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ECE8DD', padding: '14px 18px', borderRadius: '12px', fontSize: '16px', fontFamily: 'Inter, sans-serif', outline: 'none', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}
            />
            <button type="submit" disabled={joining || !joinCode} style={{ background: '#7B1016', border: 'none', color: '#fff', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: (!joinCode || joining) ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              {joining ? 'Joining...' : 'Join Room'}
            </button>
          </form>
          {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '10px' }}>{error}</p>}

          <div className="instruction-text">
            Want to start a party? <strong style={{ color: '#B9B9B9' }}>Open any movie page</strong> and click <Film size={14} color="#ff6b6b" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 4px' }}/> <span style={{ color: '#ff6b6b', fontWeight: 700 }}>Watch Party</span>
          </div>
        </div>
      </div>
    </div>
  );
}
