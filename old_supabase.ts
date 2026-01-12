import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
// You can find these in your Supabase project settings > API
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Detailed Debug Log
console.log(`[Supabase] URL: "${SUPABASE_URL}"`);
console.log(`[Supabase] Key Length: ${SUPABASE_ANON_KEY.length} chars`);

// Raw Connectivity Test (Native fetch)
if (SUPABASE_URL.startsWith('http')) {
    fetch(SUPABASE_URL)
        .then(res => console.log(`[Supabase] ≡ƒîÉ Connectivity Test: SUCCESS (${res.status})`))
        .catch(err => console.log(`[Supabase] ≡ƒîÉ Connectivity Test: FAILED (${err.message})`));
}

// Demo mode flag - set to true when credentials are not configured
export const IS_DEMO_MODE =
    !SUPABASE_URL ||
    SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
    SUPABASE_URL.length < 10;

// Create a mock client for demo mode or real client for production
let supabaseClient: SupabaseClient | null = null;

if (!IS_DEMO_MODE) {
    supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
}

export const supabase = supabaseClient;

// Export types for user profile - Aligned with 'profiles' table in Web
export interface UserProfile {
    id: string;
    full_name: string;
    is_admin: boolean;
    created_at?: string;
    updated_at?: string;
}

// Export types for subscription - Aligned with 'subscriptions' table in Web
export interface Subscription {
    id: string;
    user_id: string;
    plan_type: string;
    scans_remaining: number;
    expires_at: string;
    status: 'active' | 'expired' | 'cancelled';
    created_at?: string;
}

// Export types for usage - Logic aligned with 'daily_usage' table
export interface UsageData {
    daily_scans_used: number;
    daily_limit: number;
    can_scan: boolean;
    total_scans_available: number | "unlimited";
}
