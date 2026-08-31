import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// مطمئن شو لینک و کلید بدون هیچ حرف فارسی یا گیومه غیرانگلیسی قرار گرفته باشند
const SUPABASE_URL = 'https://nwldeqbqrixxsunmiqkr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h1l48fDLfpBvSoon-GPUMA_eQrN-8aP'; // رشته کدی که با sb_publishable_ شروع می‌شود

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
