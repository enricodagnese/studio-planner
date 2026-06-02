import { createClient, SupabaseClient } from '@supabase/supabase-js';

// LocalStorage keys for manual configuration
const STORAGE_URL_KEY = 'antigravity-studio-planner-supabase-url';
const STORAGE_KEY_KEY = 'antigravity-studio-planner-supabase-key';

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
    return { url: envUrl, anonKey: envKey };
  }

  // Second, check localStorage for custom credentials
  const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY);

  if (storedUrl && storedKey) {
    return { url: storedUrl, anonKey: storedKey };
  }

  return null;
};

// Initialize Supabase client
export const initSupabaseClient = (url?: string, key?: string): SupabaseClient | null => {
  const targetUrl = url || localStorage.getItem(STORAGE_URL_KEY) || import.meta.env.VITE_SUPABASE_URL;
  const targetKey = key || localStorage.getItem(STORAGE_KEY_KEY) || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!targetUrl || !targetKey) {
    return null;
  }

  try {
    return createClient(targetUrl, targetKey, {
      auth: {
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

// Update singleton instance with new credentials
export const updateSupabaseClient = (url: string, key: string): boolean => {
  const client = initSupabaseClient(url, key);
  if (client) {
    localStorage.setItem(STORAGE_URL_KEY, url);
    localStorage.setItem(STORAGE_KEY_KEY, key);
    supabase = client;
    return true;
  }
  return false;
};

// Clear saved credentials
export const clearSupabaseClient = () => {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_KEY_KEY);
  supabase = null;
};
