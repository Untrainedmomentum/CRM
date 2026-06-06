// assets/js/supabase.js
// Supabase client — loaded via CDN in each HTML file
// Usage: import this after config.js and the Supabase CDN script

const _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
