'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(data: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vouxa_settings")
    .update(data)
    .eq("id", 1);
    
  if (error) {
    const { error: insertError } = await supabase
      .from("vouxa_settings")
      .insert({ id: 1, ...data });
    if (insertError) return { error: insertError.message };
  }
  
  revalidatePath("/", "layout");
  return { success: true };
}
