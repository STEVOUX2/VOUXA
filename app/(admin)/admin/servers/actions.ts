'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addServer(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("vouxa_servers").insert(data);
  if (error) return { error: error.message };
  revalidatePath("/admin/servers");
  return { success: true };
}

export async function updateServer(id: string, data: any) {
  const supabase = await createClient();
  
  // Find the server to get its name for global synchronization
  const { data: server } = await supabase
    .from("vouxa_servers")
    .select("name")
    .eq("id", id)
    .single();

  if (server?.name) {
    // Update all servers with the same name (so edits to name/url apply globally)
    const { error } = await supabase
      .from("vouxa_servers")
      .update(data)
      .eq("name", server.name);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("vouxa_servers")
      .update(data)
      .eq("id", id);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/servers");
  return { success: true };
}

export async function deleteServer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vouxa_servers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/servers");
  return { success: true };
}
