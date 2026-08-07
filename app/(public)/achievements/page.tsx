import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';

export const metadata = { title: 'Achievements | VOUXA' };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect('/');
  const supabase = await createClient();

  const [{ data: all }, { data: earned }, { data: pointsRow }] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', session.user.id),
    supabase.from('user_points').select('total_points').eq('user_id', session.user.id).single()
  ]);

  const achievements = all || [];
  const earnedIds = new Set((earned || []).map((e: any) => e.achievement_id));
  const earnedMap = Object.fromEntries((earned || []).map((e: any) => [e.achievement_id, e.unlocked_at]));
  const totalPoints = pointsRow?.total_points || 0;
  const earnedCount = earnedIds.size;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div style={{ backgroundColor: '#080808', color: '#F2F2F0', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '120px 64px 80px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '3rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
              Achievements
            </h1>
            <p style={{ margin: '0', color: '#7E7E7E', fontSize: '1.1rem' }}>
              You have unlocked {earnedCount} of {totalCount} trophies
            </p>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02))',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '16px',
            padding: '16px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.05)'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: '600' }}>VOUXA Points</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FFD700', lineHeight: '1' }}>
              {totalPoints.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem', color: '#7E7E7E', fontWeight: '500' }}>
            <span>Completion Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #7B1016, #FFD700)',
              borderRadius: '4px',
              transition: 'width 1s ease-in-out'
            }} />
          </div>
        </div>

        {/* Achievements Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {achievements.map((ach) => {
            const isEarned = earnedIds.has(ach.id);
            const unlockedAt = isEarned ? new Date(earnedMap[ach.id]).toLocaleDateString() : null;

            return (
              <div key={ach.id} style={{
                backgroundColor: isEarned ? 'rgba(255,215,0,0.03)' : 'rgba(255,255,255,0.02)',
                border: isEarned ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isEarned ? '0 4px 20px rgba(255,215,0,0.05)' : 'none',
                filter: isEarned ? 'none' : 'grayscale(100%) opacity(0.6)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    width: '60px', 
                    height: '60px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: isEarned ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '12px'
                  }}>
                    {isEarned ? (ach.icon_emoji || '🏆') : '🔒'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isEarned ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                    <span style={{ fontSize: '0.8rem' }}>✨</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isEarned ? '#FFD700' : '#7E7E7E' }}>+{ach.points}</span>
                  </div>
                </div>
                
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600', color: isEarned ? '#F2F2F0' : '#A0A0A0' }}>
                  {ach.name}
                </h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#7E7E7E', lineHeight: '1.5', flexGrow: 1 }}>
                  {ach.description}
                </p>
                
                <div style={{ fontSize: '0.8rem', color: '#7E7E7E', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isEarned ? (
                    <>
                      <span style={{ color: '#FFD700' }}>✓</span> Unlocked {unlockedAt}
                    </>
                  ) : (
                    <>
                      <span>●</span> Locked
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
