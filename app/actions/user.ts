'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';


export async function addToWatchlist(tmdbId: number | string, mediaType: 'movie' | 'tv' | 'anime') {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in to add to your watchlist.' };

  const { error } = await supabase
    .from('user_watchlist')
    .insert({ user_id: user.id, tmdb_id: tmdbId.toString(), media_type: mediaType })
    .select()
    .single();

  if (error) {
    console.error("Watchlist insert error:", error);
    if (error.code === '23505') return { error: 'Item is already in your watchlist.' };
    return { error: `Failed to add to watchlist: ${error.message}` };
  }

  revalidatePath('/watchlist');
  return { success: true };
}

export async function removeFromWatchlist(tmdbId: number | string, mediaType: 'movie' | 'tv' | 'anime') {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in.' };

  const { error } = await supabase
    .from('user_watchlist')
    .delete()
    .match({ user_id: user.id, tmdb_id: tmdbId.toString(), media_type: mediaType });

  if (error) {
    console.error("Watchlist remove error:", error);
    return { error: `Failed to remove from watchlist: ${error.message}` };
  }

  revalidatePath('/watchlist');
  return { success: true };
}

export async function checkWatchlist(tmdbId: number | string, mediaType: 'movie' | 'tv' | 'anime') {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { inWatchlist: false };

  const { data, error } = await supabase
    .from('user_watchlist')
    .select('id')
    .match({ user_id: user.id, tmdb_id: tmdbId.toString(), media_type: mediaType })
    .single();

  return { inWatchlist: !!data };
}

export async function logHistory(
  tmdbId: number | string,
  mediaType: 'movie' | 'tv' | 'anime',
  runtime: number = 0,
  title?: string,
  posterPath?: string,
  duration: number = 0
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { success: false };

  const now = new Date().toISOString();

  // Try to find existing row
  const { data: existing } = await supabase
    .from('user_history')
    .select('id, runtime, duration')
    .eq('user_id', user.id)
    .eq('tmdb_id', tmdbId.toString())
    .eq('media_type', mediaType)
    .single();

  if (existing) {
    // Update timestamps and optionally add runtime
    const updateData: any = {
      last_watched_at: now,
      watched_at: now,
    };
    if (title) updateData.title = title;
    if (posterPath) updateData.poster_path = posterPath;
    if (runtime > 0) updateData.runtime = (existing.runtime || 0) + runtime;
    if (duration > 0 && (!existing.duration || existing.duration === 0)) updateData.duration = duration;

    await supabase
      .from('user_history')
      .update(updateData)
      .eq('id', existing.id);
  } else {
    // Insert new row
    const insertData: any = {
      user_id: user.id,
      tmdb_id: tmdbId.toString(),
      media_type: mediaType,
      runtime: runtime,
      duration: duration,
      last_watched_at: now,
      watched_at: now,
    };
    if (title) insertData.title = title;
    if (posterPath) insertData.poster_path = posterPath;

    const { error } = await supabase
      .from('user_history')
      .insert(insertData);

    if (error) {
      console.error('History insert error:', error);
    }
  }

  revalidatePath('/history');
  return { success: true };
}

export async function saveProgress(tmdbId: number | string, mediaType: 'movie' | 'tv' | 'anime', watchTimeMinutes: number) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { success: false };

  const now = new Date().toISOString();

  const { data: history } = await supabase
    .from('user_history')
    .select('id, runtime')
    .eq('user_id', user.id)
    .eq('tmdb_id', tmdbId.toString())
    .eq('media_type', mediaType)
    .single();

  if (history) {
    await supabase
      .from('user_history')
      .update({
        runtime: (history.runtime || 0) + watchTimeMinutes,
        watched_at: now,
        last_watched_at: now,
      })
      .eq('id', history.id);
  }

  revalidatePath('/history');
  revalidatePath('/profile');
  return { success: true };
}

export async function saveExactTime(tmdbId: number | string, mediaType: 'movie' | 'tv' | 'anime', exactTimeSeconds: number) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { success: false };

  const now = new Date().toISOString();

  // Make sure to not overwrite with a smaller value if not needed, but since it's exact time, we DO want to overwrite 
  // (in case they rewind). So we just update the runtime directly.
  const { data: history } = await supabase
    .from('user_history')
    .select('id, runtime')
    .eq('user_id', user.id)
    .eq('tmdb_id', tmdbId.toString())
    .eq('media_type', mediaType)
    .single();

  if (history) {
    await supabase
      .from('user_history')
      .update({
        runtime: exactTimeSeconds,
        watched_at: now,
        last_watched_at: now,
      })
      .eq('id', history.id);
  } else {
    await supabase
      .from('user_history')
      .insert({
        user_id: user.id,
        tmdb_id: tmdbId.toString(),
        media_type: mediaType,
        runtime: exactTimeSeconds,
        watched_at: now,
        last_watched_at: now,
      });
  }

  // We don't revalidate path here to prevent aggressive UI flashing on every 5s save
  return { success: true };
}

export async function getWatchlist() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { data, error } = await supabase
    .from('user_watchlist')
    .select('tmdb_id, media_type')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false });

  if (error) return { error: error.message };
  return { items: data };
}

export async function getHistory() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { data, error } = await supabase
    .from('user_history')
    .select('tmdb_id, media_type')
    .eq('user_id', user.id)
    .order('last_watched_at', { ascending: false });

  if (error) return { error: error.message };
  return { items: data };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const displayName = formData.get('displayName') as string;
  const usernameInput = formData.get('username') as string;
  const avatarFile = formData.get('avatar') as File | null;

  let avatarUrl = undefined;

  // If a new avatar was uploaded
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    
    // Upload to Supabase Storage bucket 'avatars'
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return { error: 'Failed to upload avatar.' };
    }

    // Get the public URL for the uploaded avatar
    const { data: { publicUrl } } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(fileName);

    avatarUrl = publicUrl;
  }

  // Update profile
  const updateData: any = {};
  if (displayName) updateData.display_name = displayName;
  if (avatarUrl) updateData.avatar_url = avatarUrl;

  if (usernameInput) {
    const cleanUsername = usernameInput.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanUsername) {
      // Check if username is already taken by someone else
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', user.id)
        .single();

      if (existing) {
        return { error: 'Username is already taken by another user.' };
      }
      updateData.username = cleanUsername;
    }
  } else if (displayName) {
    // Fallback: auto-generate username from display name if it's currently null/missing
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (currentProfile && !currentProfile.username) {
      const cleanUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanUsername) {
        updateData.username = cleanUsername;
      }
    }
  }

  if (Object.keys(updateData).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return { error: 'Failed to update profile.' };
    }
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function getPreferences() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  let { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // If no preferences exist, insert default
    const { data: newData, error: insertError } = await supabase
      .from('user_preferences')
      .insert({ user_id: user.id })
      .select()
      .single();
    
    if (insertError) return { error: insertError.message };
    data = newData;
  } else if (error) {
    return { error: error.message };
  }

  return { preferences: data };
}

export async function updatePreferences(formData: FormData) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const language = formData.get('language') as string;
  const defaultQuality = formData.get('defaultQuality') as string;
  const autoplayNext = formData.get('autoplayNext') === 'true';
  const emailNotifications = formData.get('emailNotifications') === 'true';

  const { error } = await supabase
    .from('user_preferences')
    .update({ 
      language, 
      default_quality: defaultQuality,
      autoplay_next: autoplayNext,
      email_notifications: emailNotifications,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Preferences update error:', error);
    return { error: 'Failed to update preferences.' };
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function toggleFavorite(itemId: number, mediaType: string, title: string, posterPath: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in.' };

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('media_type', mediaType)
    .single();

  if (existing) {
    await supabase.from('user_favorites').delete().eq('id', existing.id);
    return { action: 'removed' };
  } else {
    await supabase.from('user_favorites').insert({ user_id: user.id, item_id: itemId, media_type: mediaType, title, poster_path: posterPath });
    return { action: 'added' };
  }
}

export async function checkFavorite(itemId: number, mediaType: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { isFavorite: false };

  const { data } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .eq('media_type', mediaType)
    .single();

  return { isFavorite: !!data };
}

export async function getFavorites() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in', items: [] };

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message, items: [] };
  return { items: data || [] };
}

export async function addReview(itemId: number, mediaType: string, rating: number, reviewText: string, hasSpoiler: boolean) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in.' };

  const { error } = await supabase
    .from('reviews')
    .upsert({ user_id: user.id, item_id: itemId, media_type: mediaType, rating, review_text: reviewText, has_spoiler: hasSpoiler, updated_at: new Date().toISOString() }, { onConflict: 'user_id,item_id,media_type' });

  if (error) return { error: error.message };
  revalidatePath(`/${mediaType}/${itemId}`);
  return { success: true };
}

export async function getReviews(itemId: number, mediaType: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, avatar_url, username), review_votes(vote, user_id)')
    .eq('item_id', itemId)
    .eq('media_type', mediaType)
    .order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { reviews: data || [] };
}

export async function getMyReviews() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in', reviews: [] };

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message, reviews: [] };
  return { reviews: data || [] };
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: 'Not logged in' };

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function voteReview(reviewId: string, vote: 'agree' | 'disagree') {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in.' };

  // Check existing vote
  const { data: existing } = await supabase
    .from('review_votes')
    .select('id, vote')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    if (existing.vote === vote) {
      // Toggle off
      await supabase.from('review_votes').delete().eq('id', existing.id);
    } else {
      await supabase.from('review_votes').update({ vote }).eq('id', existing.id);
    }
  } else {
    await supabase.from('review_votes').insert({ review_id: reviewId, user_id: user.id, vote });
  }
  return { success: true };
}

// ─── PLAYLIST ACTIONS ───────────────────────────────────────
export async function createPlaylist(name: string, description: string, isPublic: boolean) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { data, error } = await supabase
    .from('playlists')
    .insert({ user_id: user.id, name, description, is_public: isPublic })
    .select().single();

  if (error) return { error: error.message };
  revalidatePath('/playlists');
  return { playlist: data };
}

export async function getMyPlaylists() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { playlists: [] };

  const { data } = await supabase
    .from('playlists')
    .select('*, playlist_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return { playlists: data || [] };
}

export async function addToPlaylist(playlistId: string, itemId: number, mediaType: string, title: string, posterPath: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { error } = await supabase.from('playlist_items').insert({
    playlist_id: playlistId, item_id: itemId, media_type: mediaType, title, poster_path: posterPath
  });

  if (error && error.code === '23505') return { error: 'Already in playlist' };
  if (error) return { error: error.message };
  return { success: true };
}

export async function getPlaylist(playlistId: string) {
  const supabase = await createClient();
  const { data: playlist } = await supabase.from('playlists').select('*, profiles(display_name, username, avatar_url)').eq('id', playlistId).single();
  const { data: items } = await supabase.from('playlist_items').select('*').eq('playlist_id', playlistId).order('position');
  return { playlist, items: items || [] };
}

export async function getPublicProfile(username: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('username', username).single();
  if (!profile) return { error: 'User not found' };

  const [{ data: reviews }, { data: favorites }, { data: playlists }, { data: pointsRow }] = await Promise.all([
    supabase.from('reviews').select('*, profiles(display_name, avatar_url)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('user_favorites').select('*').eq('user_id', profile.id).limit(12),
    supabase.from('playlists').select('*, playlist_items(count)').eq('user_id', profile.id).eq('is_public', true),
    supabase.from('user_points').select('total_points').eq('user_id', profile.id).single()
  ]);

  return {
    profile,
    reviews: reviews || [],
    favorites: favorites || [],
    playlists: playlists || [],
    totalPoints: pointsRow?.total_points || 0
  };
}

// ─── GAMIFICATION ACTIONS ───────────────────────────────────
export async function awardPoints(userId: string, points: number, reason: string) {
  const supabase = await createClient();
  // Upsert points total
  const { data: existing } = await supabase.from('user_points').select('total_points').eq('user_id', userId).single();
  const newTotal = (existing?.total_points || 0) + points;
  await supabase.from('user_points').upsert({ user_id: userId, total_points: newTotal, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  // Log the event
  await supabase.from('points_log').insert({ user_id: userId, points, reason });
  return { total: newTotal };
}

export async function getUserPoints() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { total: 0 };
  const { data } = await supabase.from('user_points').select('total_points').eq('user_id', user.id).single();
  return { total: data?.total_points || 0 };
}

export async function getUserAchievements() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { achievements: [], all: [] };
  
  const [{ data: all }, { data: earned }] = await Promise.all([
    supabase.from('achievements').select('*'),
    supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id)
  ]);
  
  const allAchievements = all || [];
  const earnedSet = new Set((earned || []).map(e => e.achievement_id));

  // Fetch activity stats for validation
  const [{ data: historyItems }, { count: reviewsCount }, { count: watchlistCount }, { count: playlistsCount }] = await Promise.all([
    supabase.from('user_history').select('runtime, duration, media_type').eq('user_id', user.id),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('user_watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('playlists').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  ]);

  const completedMoviesCount = (historyItems || []).filter(item => {
    if (item.media_type !== 'movie') return false;
    const dur = item.duration || 0;
    const threshold = dur > 0 ? 0.9 * dur : 90;
    return item.runtime >= threshold;
  }).length;

  const currentStats = {
    movies_watched: completedMoviesCount,
    reviews_written: reviewsCount || 0,
    watchlist_added: watchlistCount || 0,
    playlists_created: playlistsCount || 0
  };

  const newEarned = [...(earned || [])];
  for (const ach of allAchievements) {
    if (!earnedSet.has(ach.id) && ach.requirement) {
      try {
        const req = typeof ach.requirement === 'string' ? JSON.parse(ach.requirement) : ach.requirement;
        const type = req.type;
        const targetVal = req.value;
        const currentVal = (currentStats as any)[type];
        
        if (currentVal !== undefined && currentVal >= targetVal) {
          const { error: unlockErr } = await supabase
            .from('user_achievements')
            .insert({ user_id: user.id, achievement_id: ach.id });
            
          if (!unlockErr) {
            const points = ach.points || ach.points_reward || 0;
            if (points > 0) {
              await awardPoints(user.id, points, `Achievement: ${ach.name}`);
            }
            newEarned.push({ achievement_id: ach.id, unlocked_at: new Date().toISOString() });
            earnedSet.add(ach.id);
          }
        }
      } catch (err) {
        console.error("Error parsing requirement for achievement", ach.id, err);
      }
    }
  }
  
  return { all: allAchievements, earned: newEarned };
}

export async function unlockAchievement(achievementId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };
  
  // Check not already earned
  const { data: existing } = await supabase.from('user_achievements').select('id').eq('user_id', user.id).eq('achievement_id', achievementId).single();
  if (existing) return { alreadyEarned: true };
  
  // Get achievement details for points
  const { data: achievement } = await supabase.from('achievements').select('*').eq('id', achievementId).single();
  if (!achievement) return { error: 'Achievement not found' };
  
  await supabase.from('user_achievements').insert({ user_id: user.id, achievement_id: achievementId });
  if (achievement.points_reward > 0) {
    await awardPoints(user.id, achievement.points_reward, `Achievement: ${achievement.name}`);
  }
  
  return { success: true, achievement };
}

export async function getChallenges() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: challenges } = await supabase.from('challenges').select('*').eq('active', true);
  
  if (!user) return { challenges: challenges || [], progress: [] };
  
  const { data: progress } = await supabase
    .from('user_challenge_progress')
    .select('*')
    .eq('user_id', user.id);
  
  return { challenges: challenges || [], progress: progress || [] };
}

// ─── WATCH PARTY ACTIONS ───────────────────────────────────────────────────

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createWatchParty(
  movieId: number, mediaType: string, movieTitle: string, moviePoster: string, serverUrl: string
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in.' };

  const { data: profile } = await supabase.from('profiles').select('display_name, username').eq('id', user.id).single();
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Host';

  let roomCode = generateRoomCode();
  // Ensure unique
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase.from('watch_parties').select('id').eq('room_code', roomCode).single();
    if (!existing) break;
    roomCode = generateRoomCode();
    attempts++;
  }

  const { data: party, error } = await supabase
    .from('watch_parties')
    .insert({ host_id: user.id, room_code: roomCode, movie_id: movieId, media_type: mediaType, movie_title: movieTitle, movie_poster: moviePoster, server_url: serverUrl })
    .select().single();

  if (error) return { error: error.message };

  // Add host as first member
  await supabase.from('party_members').insert({ party_id: party.id, user_id: user.id, display_name: displayName });

  // System message
  await supabase.from('party_messages').insert({ party_id: party.id, user_id: user.id, display_name: 'System', content: `${displayName} created the watch party!`, message_type: 'system' });

  return { party, roomCode };
}

export async function joinWatchParty(roomCode: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'You must be logged in.' };

  const { data: party } = await supabase.from('watch_parties').select('*').eq('room_code', roomCode.toUpperCase()).single();
  if (!party) return { error: 'Room not found.' };

  const { data: profile } = await supabase.from('profiles').select('display_name, username, avatar_url').eq('id', user.id).single();
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Viewer';

  // Upsert member
  await supabase.from('party_members').upsert({ party_id: party.id, user_id: user.id, display_name: displayName, avatar_url: profile?.avatar_url, is_active: true }, { onConflict: 'party_id,user_id' });

  // System message
  await supabase.from('party_messages').insert({ party_id: party.id, user_id: user.id, display_name: 'System', content: `${displayName} joined the party!`, message_type: 'system' });

  return { party };
}

export async function getWatchParty(roomCode: string) {
  const supabase = await createClient();
  const { data: party } = await supabase.from('watch_parties').select('*').eq('room_code', roomCode.toUpperCase()).single();
  if (!party) return { error: 'Room not found' };

  const [{ data: messages }, { data: members }] = await Promise.all([
    supabase.from('party_messages').select('*').eq('party_id', party.id).order('created_at', { ascending: true }).limit(100),
    supabase.from('party_members').select('*').eq('party_id', party.id).eq('is_active', true)
  ]);

  const user = await getCurrentUser();
  return { party, messages: messages || [], members: members || [], currentUserId: user?.id };
}

export async function sendPartyMessage(partyId: string, content: string, messageType: string = 'text') {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { data: profile } = await supabase.from('profiles').select('display_name, username').eq('id', user.id).single();
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User';

  const { error } = await supabase.from('party_messages').insert({ party_id: partyId, user_id: user.id, display_name: displayName, content, message_type: messageType });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePartyStatus(partyId: string, status: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { error } = await supabase.from('watch_parties').update({ status, started_at: status === 'playing' ? new Date().toISOString() : undefined }).eq('id', partyId).eq('host_id', user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePlaylist(playlistId: string, name: string, description: string, isPublic: boolean, coverStyle?: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { data, error } = await supabase
    .from('playlists')
    .update({ name, description, is_public: isPublic, cover_style: coverStyle, updated_at: new Date().toISOString() })
    .eq('id', playlistId)
    .eq('user_id', user.id)
    .select().single();

  if (error) return { error: error.message };
  revalidatePath('/playlists');
  return { success: true, playlist: data };
}

export async function removeFromPlaylist(playlistId: string, itemId: number, mediaType: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('item_id', itemId)
    .eq('media_type', mediaType);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deletePlaylist(playlistId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { error: 'Not logged in' };

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/playlists');
  return { success: true };
}

export async function searchMedia(query: string) {
  const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '52194d6e9a65d064cfb3cc6c57f92026';
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${KEY}&query=${encodeURIComponent(query)}&language=en-US`);
    if (res.ok) {
      const data = await res.json();
      return { results: data.results || [] };
    }
  } catch (e: any) {
    return { error: e.message };
  }
  return { results: [] };
}


