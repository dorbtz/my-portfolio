import { supabase } from "../lib/supabaseClient";

/**
 * Upload a cover image to the 'project-covers' bucket.
 * Returns the *public* URL (bucket is public + policy allows read).
 */
export async function uploadProjectCover(file: File, userId: string) {
  if (!supabase) throw new Error("Supabase not configured");

  // Basic sanity
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file (png, jpg, webp).");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image is too large (max 4MB).");
  }

  // Path: userId/timestamp_cleanName
  const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error: upErr } = await supabase
    .storage
    .from("project-covers")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (upErr) throw upErr;

  // Public URL
  const { data } = supabase
    .storage
    .from("project-covers")
    .getPublicUrl(path);

  return { path, url: data.publicUrl as string };
}

/** Optional: delete a previously uploaded cover by its storage path */
export async function deleteProjectCover(path: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.storage.from("project-covers").remove([path]);
  if (error) throw error;
  return true;
}
