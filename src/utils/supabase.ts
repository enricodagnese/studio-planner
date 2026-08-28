import { createClient, SupabaseClient } from '@supabase/supabase-js';

// LocalStorage keys for manual configuration
const STORAGE_URL_KEY = 'antigravity-studio-planner-supabase-url';
const STORAGE_KEY_KEY = 'antigravity-studio-planner-supabase-key';
const AUTH_STORAGE_KEY = 'antigravity-studio-planner-auth-token';

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

// Get credentials from env or localStorage
export const getSupabaseCredentials = (): SupabaseCredentials | null => {
  // First, check env variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  // Second, check localStorage for custom credentials
  const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY);

  if (storedUrl && storedKey) {
    return { url: storedUrl.trim(), anonKey: storedKey.trim() };
  }

  return null;
};

// Initialize Supabase client
export const initSupabaseClient = (url?: string, key?: string): SupabaseClient | null => {
  let targetUrl = (url || localStorage.getItem(STORAGE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL || '').trim();
  let targetKey = (key || localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!targetUrl || !targetKey) {
    return null;
  }

  // Ensure url starts with https:// if protocol was omitted
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    return createClient(targetUrl, targetKey, {
      auth: {
        storageKey: AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

// Singleton active client instance
export let supabase = initSupabaseClient();

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabase) {
    supabase = initSupabaseClient();
  }
  return supabase;
};

// Update singleton instance with new credentials
export const updateSupabaseClient = (url: string, key: string): boolean => {
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  const client = initSupabaseClient(trimmedUrl, trimmedKey);
  if (client) {
    localStorage.setItem(STORAGE_URL_KEY, trimmedUrl);
    localStorage.setItem(STORAGE_KEY_KEY, trimmedKey);
    supabase = client;
    return true;
  }
  return false;
};

// Clear saved credentials
export const clearSupabaseClient = () => {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  supabase = null;
};
