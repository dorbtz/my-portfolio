import { supabase } from "../lib/supabase";

/**
 * Upload a cover image to the 'project-covers' bucket.
 * Returns the *public* URL (bucket is public + policy allows read).
 */
export async function uploadProjectCover(file: File, userId: string) {
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
  const { error } = await supabase.storage.from("project-covers").remove([path]);
  if (error) throw error;
  return true;
}

/**
 * Upload an admin avatar to the public 'avatars' bucket.
 * Path is `userId/timestamp_filename` so RLS folder-prefix policy passes.
 * Returns { path, url } where url is the publicly-served URL.
 */
export async function uploadAvatar(file: File, userId: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file (png, jpg, webp).");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Avatar is too large (max 2MB).");
  }
  const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `${userId}/${Date.now()}_${safeName}`;
  const { error: upErr } = await supabase
    .storage
    .from("avatars")
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { path, url: data.publicUrl as string };
}

/**
 * Upload a contact-section media asset (PNG backdrop or WEBM animation)
 * to the public 'contact-media' bucket. Admin-only writes per RLS policy.
 *
 * `kind` controls allowed mime + max size:
 *   - 'image' → image/* up to 4 MB
 *   - 'video' → video/webm (or video/*) up to 12 MB
 */
export async function uploadContactMedia(
  file: File,
  kind: 'image' | 'video',
) {
  if (kind === 'image') {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file (png, jpg, webp).');
    }
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('Image is too large (max 4MB).');
    }
  } else {
    if (!file.type.startsWith('video/')) {
      throw new Error('Please upload a video file (.webm preferred).');
    }
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('Video is too large (max 12MB).');
    }
  }
  const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  const path = `${kind}/${Date.now()}_${safeName}`;
  const { error: upErr } = await supabase
    .storage
    .from('contact-media')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from('contact-media').getPublicUrl(path);
  return { path, url: data.publicUrl as string };
}

export async function deleteContactMedia(path: string) {
  const { error } = await supabase.storage.from('contact-media').remove([path]);
  if (error) throw error;
  return true;
}
