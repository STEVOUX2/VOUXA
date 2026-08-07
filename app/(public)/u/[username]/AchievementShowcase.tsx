'use client';

import * as LucideIcons from 'lucide-react';

export function AchievementShowcase({ achievements, earned }: { achievements: any[], earned: any[] }) {
  if (!earned || earned.length === 0) return null;

  const getAchievementIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;
    return <IconComponent size={24} strokeWidth={1.5} />;
  };

  const rarityColors: Record<string, { bg: string, border: string, text: string }> = {
    common: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', text: '#B9B9B9' },
    uncommon: { bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.2)', text: '#4ade80' },
    rare: { bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.2)', text: '#60a5fa' },
    epic: { bg: 'rgba(168,85,247,0.05)', border: 'rgba(168,85,247,0.2)', text: '#c084fc' },
    legendary: { bg: 'rgba(234,179,8,0.05)', border: 'rgba(234,179,8,0.2)', text: '#facc15' },
    mythic: { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.2)', text: '#f87171' }
  };

  // Only show earned achievements
  const earnedFull = earned.map(e => {
    const full = achievements.find(a => a.id === e.achievement_id);
    return { ...full, unlocked_at: e.unlocked_at };
  }).filter(a => a && a.id);

  // Sort by rarity (mythic down to common)
  const order = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  earnedFull.sort((a, b) => (order[b.rarity as keyof typeof order] || 0) - (order[a.rarity as keyof typeof order] || 0));

  return (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg, #7B1016, #5D0F14)', borderRadius: '999px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F2F2F0', margin: 0 }}>Achievement Showcase</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {earnedFull.map((ach: any) => {
          const colors = rarityColors[ach.rarity] || rarityColors.common;
          return (
            <div key={ach.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              background: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: '12px', transition: 'transform 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'none'}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `linear-gradient(135deg, ${colors.border}, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.text, flexShrink: 0,
                boxShadow: `0 0 12px ${colors.border}`
              }}>
                {getAchievementIcon(ach.icon)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#F2F2F0', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ach.name}</div>
                <div style={{ fontSize: '11px', color: '#7E7E7E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{new Date(ach.unlocked_at).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
