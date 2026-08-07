'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

/**
 * Removes a specific media item from the user's history
 */
export async function removeHistoryItem(tmdbId: string | number, mediaType: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { error } = await supabase
      .from('user_history')
      .delete()
      .eq('user_id', user.id)
      .eq('tmdb_id', tmdbId.toString())
      .eq('media_type', mediaType);

    if (error) {
      console.error('Error removing history item:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/history');
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error('Error removing history item:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clears the user's entire watch history
 */
export async function clearFullHistory() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { error } = await supabase
      .from('user_history')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing full history:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/history');
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error('Error clearing full history:', error);
    return { success: false, error: error.message };
  }
}
