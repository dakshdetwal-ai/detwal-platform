/* DETwal Supabase browser client.
   The publishable key is intended for browser use.
   Protect all data with Supabase Auth and Row Level Security (RLS).
   Never place a secret/service_role key in this file.
*/
(() => {
  const SUPABASE_URL = 'https://evsnwenvmwhrohyzrjgq.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Vfy2VLbqRYB_DOsK13iuqA_9-pk4Q5t';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JS library did not load.');
    return;
  }

  window.detwalSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    }
  );
})();
