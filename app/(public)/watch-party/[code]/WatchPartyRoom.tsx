'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sendPartyMessage, updatePartyStatus } from '@/app/actions/user';

const REACTION_EMOJIS = ['🔥', '😂', '😍', '👏', '😱', '🎉', '💀', '🤯', '❤️', '🍿'];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

interface Message {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface Member {
  user_id: string;
  display_name: string;
  avatar_url?: string;
}

interface Props {
  party: any;
  initialMessages: Message[];
  initialMembers: Member[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  initialServers: any[];
}

export function WatchPartyRoom({ party, initialMessages, initialMembers, currentUserId, currentUserName, currentUserAvatar, initialServers }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [partyStatus, setPartyStatus] = useState(party.status);
  const [copied, setCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatWidth] = useState(340);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState(false);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsVirtualFullscreen(!!document.fullscreenElement);
      // Auto lock/unlock landscape on mobile
      const orientation: any = screen.orientation;
      if (document.fullscreenElement) {
        if (orientation && orientation.lock) orientation.lock('landscape').catch(() => {});
      } else {
        if (orientation && orientation.unlock) orientation.unlock();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  const getInitialServer = () => {
    const defaultServer = initialServers.find(s => s.name.toLowerCase().includes('cinesrc'));
    if (defaultServer) {
      if (defaultServer.url_template) return defaultServer.url_template.replace('{id}', party.movie_id);
      return defaultServer.embed_url;
    }
    return '';
  };

  const [selectedServer, setSelectedServer] = useState(getInitialServer());
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);

  const [videoProgress, setVideoProgress] = useState({ currentTime: 0, duration: 0, event: '' });
  const [hostProgress, setHostProgress] = useState({ currentTime: 0, duration: 0, event: '' });

  const playerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isHost = party.host_id === currentUserId;
  const supabase = createClient();

  // ── Supabase Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`party-${party.id}`, {
        config: { presence: { key: currentUserId } }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'party_messages',
        filter: `party_id=eq.${party.id}`,
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);

        // If it's a reaction, trigger floating animation
        if (msg.message_type === 'reaction') {
          spawnFloatingReaction(msg.content);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'watch_parties',
        filter: `id=eq.${party.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.status === 'playing' && partyStatus !== 'playing') {
          setPartyStatus('playing');
          startCountdown();
        } else {
          setPartyStatus(updated.status);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const active = Object.values(state).flat() as any[];
        const unique = Array.from(new Map(active.map(item => [item.user_id, item])).values());
        setMembers(unique);
      })
      .on('broadcast', { event: 'player_sync' }, (payload) => {
        if (!isHost) {
          const hostData = payload.payload;
          setHostProgress(hostData);

          // Attempt to auto-sync the local player (CineSrc API)
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            const sendCmd = (command: string, args: any[] = []) => {
              iframe.contentWindow?.postMessage({ type: 'cinesrc:command', command, args }, '*');
            };

            if (hostData.event === 'play') sendCmd('play');
            else if (hostData.event === 'pause') sendCmd('pause');
            else if (hostData.event === 'seeked') sendCmd('seek', [hostData.currentTime]);
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            display_name: currentUserName,
            avatar_url: currentUserAvatar
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [party.id, isHost]);

  // ── Iframe Progress Listener ──────────────────────────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const processEvent = (playerEvent: string, currentTime: number, duration: number) => {
        const progressData = { currentTime, duration, event: playerEvent };
        setVideoProgress(progressData);

        if (isHost) {
          setHostProgress(progressData);
          // Broadcast to guests (throttle timeupdates, but send immediate on play/pause/seeked)
          if (['play', 'pause', 'seeked'].includes(playerEvent) || Math.floor(currentTime) % 5 === 0) {
            const channel = supabase.channel(`party-${party.id}`);
            channel.send({
              type: 'broadcast',
              event: 'player_sync',
              payload: progressData
            });
          }
        }
      };

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // 1. VidKing Support
        if (data && data.type === 'PLAYER_EVENT' && data.data) {
          processEvent(data.data.event, data.data.currentTime, data.data.duration);
        }
        
        // 2. CineSrc Support
        if (data && data.type && typeof data.type === 'string' && data.type.startsWith('cinesrc:')) {
          const eventName = data.type.split(':')[1];
          if (['play', 'pause', 'timeupdate', 'seeked'].includes(eventName)) {
            processEvent(eventName, data.currentTime || 0, data.duration || 0);
          }
        }
        
        // 3. VidEasy Support
        if (data && typeof data.timestamp === 'number' && typeof data.duration === 'number') {
          // VidEasy mostly sends continuous progress updates
          processEvent('timeupdate', data.timestamp, data.duration);
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isHost, party.id]);

  // ── Auto-scroll chat ────────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Floating reaction spawner ────────────────────────────────────────────
  const spawnFloatingReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = 20 + Math.random() * 60; // % from left of chat panel
    setFloatingReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  }, []);

  // ── Countdown ──────────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    let count = 5;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  // ── Host: Start party ──────────────────────────────────────────────────
  const handleStartParty = async () => {
    await updatePartyStatus(party.id, 'playing');
    await sendPartyMessage(party.id, `🎬 Party started! Everyone press PLAY in 5 seconds!`, 'system');
    startCountdown();
  };

  // ── Send chat message ──────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput('');
    await sendPartyMessage(party.id, trimmed, 'text');
    setSending(false);
    inputRef.current?.focus();
  };

  // ── Send reaction ──────────────────────────────────────────────────────
  const handleReaction = async (emoji: string) => {
    spawnFloatingReaction(emoji); // Instant local feedback
    setShowEmojiPicker(false);
    await sendPartyMessage(party.id, emoji, 'reaction');
  };

  // ── Copy room code ──────────────────────────────────────────────────────
  const copyCode = () => {
    navigator.clipboard.writeText(party.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/watch-party/${party.room_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch(err => {
        alert(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Filter to only allow specified servers
  const allowedServers = initialServers.filter(s => 
    ['cinesrc', 'vidking', 'videasy'].some(name => s.name.toLowerCase().includes(name))
  );

  const dynamicServers = allowedServers.map(s => {
    let url = s.url_template ? s.url_template.replace('{id}', party.movie_id) : s.embed_url;
    
    // Auto-fix vidking URLs
    if (s.name.toLowerCase().includes('vidking')) {
      url = `https://www.vidking.net/embed/${party.media_type}/${party.movie_id}`;
    } else if (s.name.toLowerCase().includes('videasy')) {
      // Auto-inject premium parameters for VidEasy (Netflix overlay, color, etc)
      url = `https://player.videasy.net/${party.media_type}/${party.movie_id}?nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&overlay=true&color=7B1016`;
    } else if (url && url.includes('vidking.com')) {
      url = url.replace('vidking.com', 'vidking.net');
    }
    
    return { name: s.name, url };
  });
  
  const servers = dynamicServers.length > 0 ? dynamicServers : [
    { name: 'CineSrc', url: `https://cinesrc.st/embed/${party.media_type}/${party.movie_id}` }
  ];

  return (
    <div style={{ background: '#050505', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── Top Bar ── */}
      <div style={{ height: '52px', background: 'rgba(8,8,8,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 10 }}>
        
        {/* Left: Movie info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          {party.movie_poster && (
            <img src={`https://image.tmdb.org/t/p/w92${party.movie_poster}`} alt={party.movie_title || 'Movie poster'} style={{ width: '28px', height: '42px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F2F2F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{party.movie_title || 'Watch Party'}</div>
            <div style={{ fontSize: '11px', color: '#7E7E7E' }}>{members.length} watching</div>
          </div>
        </div>

        {/* Center: Room code + status + Server */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Custom Server Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setServerDropdownOpen(!serverDropdownOpen)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 14px', color: '#F2F2F0', fontSize: '12px', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {servers.find(s => s.url === selectedServer)?.name || 'Select Server'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: serverDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {serverDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#080808', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 100, minWidth: '150px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {servers.map(s => (
                  <button 
                    key={s.url}
                    onClick={() => { setSelectedServer(s.url); setServerDropdownOpen(false); }}
                    style={{ background: selectedServer === s.url ? 'rgba(123,16,22,0.3)' : 'transparent', border: 'none', color: '#F2F2F0', fontSize: '12px', padding: '8px 12px', borderRadius: '4px', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => { if (selectedServer !== s.url) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (selectedServer !== s.url) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#7E7E7E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Room</span>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#F2F2F0', letterSpacing: '0.15em' }}>{party.room_code}</span>
            <button onClick={copyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : '#7E7E7E', fontSize: '12px', padding: 0, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={copyLink} style={{ background: 'rgba(123,16,22,0.15)', border: '1px solid rgba(123,16,22,0.3)', borderRadius: '8px', padding: '6px 14px', color: '#ff6b6b', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            🔗 Share Link
          </button>
        </div>

        {/* Right: Members avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {members.slice(0, 6).map((m, i) => (
            <div key={m.user_id} title={m.display_name} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#F2F2F0', border: '2px solid #050505', marginLeft: i > 0 ? '-6px' : 0, overflow: 'hidden', zIndex: members.length - i }}>
              {m.avatar_url ? <img src={m.avatar_url} alt={m.display_name || 'User avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.display_name[0]?.toUpperCase()}
            </div>
          ))}
          {members.length > 6 && <div style={{ fontSize: '11px', color: '#7E7E7E', marginLeft: '8px' }}>+{members.length - 6}</div>}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Movie Player (left) ── */}
        <div 
          ref={playerRef} 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#000', cursor: isIdle ? 'none' : 'default' }}
          onMouseMove={() => {
            setIsIdle(false);
            if (idleTimeout.current) clearTimeout(idleTimeout.current);
            idleTimeout.current = setTimeout(() => setIsIdle(true), 3000);
          }}
          onMouseLeave={() => setIsIdle(false)}
        >
          
          {/* Player iframe */}
          <div style={{ flex: 1, position: 'relative' }}>
            
            {/* Watch Progress Display */}
            {(videoProgress.duration > 0 || hostProgress.duration > 0) && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)', zIndex: 50 }}>
                {/* Host progress (red) */}
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'rgba(123,16,22,0.8)', width: `${(hostProgress.currentTime / hostProgress.duration) * 100}%`, transition: 'width 1s linear' }} />
                
                {/* My progress (white indicator) */}
                {!isHost && videoProgress.duration > 0 && (
                  <div style={{ position: 'absolute', top: '-2px', left: `calc(${(videoProgress.currentTime / videoProgress.duration) * 100}% - 4px)`, width: '8px', height: '8px', background: '#F2F2F0', borderRadius: '50%', boxShadow: '0 0 4px rgba(0,0,0,0.5)', zIndex: 51, transition: 'left 1s linear' }} title="Your position" />
                )}
              </div>
            )}

            {/* Status Tooltip */}
            {!isHost && hostProgress.event === 'pause' && (
              <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: '#ECE8DD', fontSize: '12px', fontWeight: 600, zIndex: 60, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#ff6b6b' }}>⏸️ Host Paused</span> 
                at {new Date(hostProgress.currentTime * 1000).toISOString().substr(14, 5)}
              </div>
            )}

            {partyStatus !== 'waiting' ? (
              <iframe
                key={selectedServer}
                src={selectedServer}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                allowFullScreen
                allow="fullscreen"
                title={party.movie_title}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#050505' }} />
            )}

            {/* Wake-up Overlay: Captures the first mouse move when idle over the iframe */}
            {isIdle && (
              <div 
                style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'transparent' }} 
                onMouseMove={() => {
                  setIsIdle(false);
                  if (idleTimeout.current) clearTimeout(idleTimeout.current);
                  idleTimeout.current = setTimeout(() => setIsIdle(true), 3000);
                }}
              />
            )}

            {/* Fullscreen button */}
            <button 
              onClick={toggleFullscreen}
              onMouseEnter={() => setIsIdle(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 10px', color: '#F2F2F0', cursor: 'pointer', zIndex: 60, backdropFilter: 'blur(4px)', opacity: isIdle ? 0 : 1, transition: 'opacity 0.3s', pointerEvents: isIdle ? 'none' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Fullscreen"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isVirtualFullscreen ? (
                  <>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </>
                ) : (
                  <>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </>
                )}
              </svg>
            </button>

            {/* Countdown overlay */}
            {countdown !== null && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '120px', fontWeight: 900, color: '#F2F2F0', lineHeight: 1, animation: 'countPulse 1s ease-in-out', fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
                  <div style={{ fontSize: '18px', color: '#B9B9B9', marginTop: '16px', fontWeight: 600 }}>Press PLAY now! 🍿</div>
                  <style>{`@keyframes countPulse { 0% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
                </div>
              </div>
            )}

            {/* Waiting overlay (before party starts) */}
            {partyStatus === 'waiting' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, backdropFilter: 'blur(2px)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', marginBottom: '8px' }}>Waiting for host to start...</div>
                  <div style={{ fontSize: '14px', color: '#7E7E7E' }}>The movie will begin with a synchronized countdown</div>
                  {isHost && (
                    <button onClick={handleStartParty} style={{ marginTop: '24px', background: '#7B1016', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 24px rgba(123,16,22,0.4)' }}>
                      🎬 Start Party
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Host start button (when waiting) - compact version always visible */}
            {isHost && partyStatus === 'waiting' && (
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
                <button onClick={handleStartParty} style={{ background: '#7B1016', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: '999px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎬</span> Start Party for Everyone
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat Sidebar (right) ── */}
        <div style={{ width: `${chatWidth}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(8,8,8,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          
          {/* Floating emoji reactions */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 20 }}>
            {floatingReactions.map(r => (
              <div key={r.id} style={{
                position: 'absolute', bottom: '80px', left: `${r.x}%`,
                fontSize: '32px', animation: 'floatUp 2.5s ease-out forwards',
                pointerEvents: 'none',
              }}>
                {r.emoji}
              </div>
            ))}
            <style>{`
              @keyframes floatUp {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                70% { opacity: 1; }
                100% { transform: translateY(-280px) scale(1.4); opacity: 0; }
              }
            `}</style>
          </div>

          {/* Chat header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#F2F2F0' }}>💬 Party Chat</span>
            <span style={{ fontSize: '11px', color: '#7E7E7E', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '20px' }}>{members.length} online</span>
          </div>

          {/* Messages list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            
            {/* ── System Guide ── */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ff6b6b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Welcome to the Watch Party!</span> 🍿
              </div>
              <div style={{ fontSize: '11px', color: '#7E7E7E', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '8px' }}>Because VOUXA streams from secure external servers, the video sync experience depends entirely on the <strong>Server</strong> you select at the top:</p>
                
                <div style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', borderLeft: '2px solid #4ade80' }}>
                  <strong style={{ color: '#F2F2F0' }}>🎬 CineSrc (Recommended) - Full Auto-Sync</strong><br/>
                  When the Host pauses or skips, VOUXA will automatically pause and skip everyone else's video to match! You don't have to touch anything.
                </div>

                <div style={{ marginBottom: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', borderLeft: '2px solid #fbbf24' }}>
                  <strong style={{ color: '#F2F2F0' }}>👑 VidKing & VidEasy - Visual Sync</strong><br/>
                  These servers power the live Progress Bar at the top of the screen. If the Host pauses, you will see a popup, but you must manually pause your own video to stay in sync.
                </div>

                <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(123,16,22,0.1)', borderRadius: '6px', color: '#ff6b6b' }}>
                  <strong>Best Experience:</strong> Use the 🔲 Fullscreen button at the top right to hide the chat and immerse yourself in the movie!
                </div>
              </div>
            </div>
            {messages.map(msg => {
              if (msg.message_type === 'system') {
                return (
                  <div key={msg.id} style={{ textAlign: 'center', padding: '6px 0' }}>
                    <span style={{ fontSize: '11px', color: '#4E4E4E', background: 'rgba(255,255,255,0.03)', padding: '4px 12px', borderRadius: '20px' }}>{msg.content}</span>
                  </div>
                );
              }
              if (msg.message_type === 'reaction') {
                return (
                  <div key={msg.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
                    <span style={{ fontSize: '10px', color: '#4E4E4E', fontWeight: 600 }}>{msg.display_name}</span>
                    <span style={{ fontSize: '20px' }}>{msg.content}</span>
                  </div>
                );
              }
              const isMe = msg.user_id === currentUserId;
              return (
                <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '3px 0', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1016, #5D0F14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#F2F2F0', flexShrink: 0 }}>
                    {msg.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ maxWidth: '80%' }}>
                    {!isMe && <div style={{ fontSize: '10px', color: '#4E4E4E', fontWeight: 700, marginBottom: '2px' }}>{msg.display_name}</div>}
                    <div style={{ background: isMe ? 'rgba(123,16,22,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isMe ? 'rgba(123,16,22,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px', padding: '7px 12px', fontSize: '13px', color: '#ECE8DD', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                    <div suppressHydrationWarning style={{ fontSize: '9px', color: '#4E4E4E', marginTop: '2px', textAlign: isMe ? 'right' : 'left' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Reaction bar */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {REACTION_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => handleReaction(emoji)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px', transition: 'background 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >{emoji}</button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Say something..."
                maxLength={300}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ECE8DD', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none' }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(123,16,22,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button type="submit" disabled={!input.trim() || sending} style={{ background: '#7B1016', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || sending) ? 0.5 : 1, flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
