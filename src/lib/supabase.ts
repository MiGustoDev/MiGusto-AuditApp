import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

export const AUDIT_PHOTOS_BUCKET = 'audit-photos';

/**
 * Upload an image blob to Supabase Storage.
 * Returns public URL or null if storage fails/is not configured.
 */
export async function uploadPhotoToSupabase(blob: Blob): Promise<{ url: string } | null> {
  if (!supabase) return null;

  try {
    const ext = blob.type.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(AUDIT_PHOTOS_BUCKET)
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.warn('Supabase storage upload error (will fallback to Data URL):', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from(AUDIT_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (err) {
    console.warn('Failed to upload photo to Supabase storage:', err);
    return null;
  }
}
