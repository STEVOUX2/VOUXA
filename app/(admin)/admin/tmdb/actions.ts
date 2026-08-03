'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateHomepageConfig(config: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vouxa_settings")
    .update({ homepage_config: config })
    .eq("id", 1);
    
  if (error) {
    // If it fails because the row doesn't exist, try to insert it
    const { error: insertError } = await supabase
      .from("vouxa_settings")
      .insert({ id: 1, homepage_config: config });
    if (insertError) return { error: insertError.message };
  }
  
  revalidatePath("/");
  revalidatePath("/admin/tmdb");
  return { success: true };
}
