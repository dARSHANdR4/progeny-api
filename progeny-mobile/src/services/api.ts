import { supabase, IS_DEMO_MODE } from '../lib/supabase';

// API Configuration
// Point this to your Next.js backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Demo mock data
const DEMO_HISTORY = [
    {
        id: 'demo-1',
        crop_type: 'Tomato',
        disease_name: 'Early Blight',
        confidence_score: 0.895,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        image_url: null,
        remedies: ['Remove affected leaves', 'Apply copper-based fungicide'],
    },
    {
        id: 'demo-2',
        crop_type: 'Potato',
        disease_name: 'Late Blight',
        confidence_score: 0.923,
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        image_url: null,
        remedies: ['Destroy infected plants', 'Apply fungicide preventatively'],
    },
    {
        id: 'demo-3',
        crop_type: 'Apple',
        disease_name: 'Healthy',
        confidence_score: 0.987,
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        image_url: null,
        remedies: [],
    },
];

// Generic fetch wrapper with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // In demo mode, return mock data
    if (IS_DEMO_MODE) {
        throw new Error('Demo mode - no API calls');
    }

    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (session?.access_token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// Scan API
export const scanApi = {
    scan: async (imageUri: string, cropType: string) => {
        // In demo mode, return mock scan result
        if (IS_DEMO_MODE) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            return {
                id: `demo-${Date.now()}`,
                crop_type: cropType,
                disease_name: 'Early Blight (Demo)',
                confidence_score: 0.87,
                remedies: [
                    'Remove affected leaves immediately',
                    'Apply copper-based fungicide',
                    'Improve air circulation around plants',
                ],
                is_healthy: false,
            };
        }

        if (!supabase) {
            throw new Error('Supabase not initialized');
        }

        // Create form data for image upload
        const formData = new FormData();

        // Extract filename from URI
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
        } as any);
        formData.append('crop_type', cropType);

        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(`${API_BASE_URL}/api/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Scan failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    },
};

// Usage API
export const usageApi = {
    getUsage: async () => {
        if (IS_DEMO_MODE) {
            return {
                daily_scans_used: 2,
                daily_limit: 5,
                can_scan: true,
                total_scans_available: 3,
            };
        }

        if (!supabase) throw new Error('Supabase not initialized');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        // Fetch today's usage
        const today = new Date().toISOString().split('T')[0];
        const { data: usageData } = await supabase
            .from('daily_usage')
            .select('scans_used')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        // Fetch active subscription
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('scans_remaining, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString())
            .single();

        const isAdmin = profile?.is_admin || false;
        const scansUsed = usageData?.scans_used || 0;
        const dailyLimit = isAdmin ? Infinity : 5;
        const subScans = subscription?.scans_remaining || 0;

        return {
            daily_scans_used: scansUsed,
            daily_limit: dailyLimit,
            can_scan: isAdmin || subScans > 0 || scansUsed < dailyLimit,
            total_scans_available: isAdmin ? 'unlimited' : (subScans > 0 ? subScans : Math.max(0, dailyLimit - scansUsed)),
        };
    },
};

// Payment API
export const paymentApi = {
    createCheckout: (priceId: string) => {
        if (IS_DEMO_MODE) {
            return Promise.resolve({ url: 'https://demo.stripe.com/checkout' });
        }
        return fetchWithAuth('/api/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ priceId }),
        });
    },

    verifyPayment: (sessionId: string) => {
        if (IS_DEMO_MODE) {
            return Promise.resolve({ success: true, subscription: { plan: 'premium' } });
        }
        return fetchWithAuth(`/api/payment/verify?session_id=${sessionId}`);
    },
};

// History API
export const historyApi = {
    getScanHistory: async (page = 1, limit = 20) => {
        if (IS_DEMO_MODE) {
            // Return demo history data
            return { scans: DEMO_HISTORY };
        }

        if (!supabase) throw new Error('Supabase not initialized');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Map fields to match what the UI expects (crop_type might be parsed/extracted if needed, 
        // but for now, we assume the backend stores it in a compatible way or the UI handles it)
        return {
            scans: data.map(scan => ({
                ...scan,
                crop_type: scan.crop_type || scan.disease_name.split(' ')[0] || 'Unknown' // Fallback if crop_type column missing
            }))
        };
    },
};

// Community API
export const communityApi = {
    getPosts: async () => {
        if (IS_DEMO_MODE) return { posts: [] };
        if (!supabase) throw new Error('Supabase not initialized');

        const { data: { user } } = await supabase.auth.getUser();

        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (user && posts) {
            // Fetch all likes for this user to mark "user_liked"
            const { data: myLikes } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', user.id);

            const likedPostIds = new Set(myLikes?.map(l => l.post_id) || []);

            const postsWithLiked = posts.map(post => ({
                ...post,
                user_liked: likedPostIds.has(post.id)
            }));

            return { posts: postsWithLiked };
        }

        return { posts: posts || [] };
    },
    createPost: async (content: string, imageUrl?: string) => {
        if (IS_DEMO_MODE) return { success: true };
        if (!supabase) throw new Error('Supabase not initialized');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Fetch user profile for name/location
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                user_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown Farmer',
                content,
                image_url: imageUrl,
                location: 'Remote Farmer' // Could be dynamic if GPS added
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, post: data };
    },
    toggleLike: async (postId: string) => {
        if (IS_DEMO_MODE) return { success: true };
        if (!supabase) throw new Error('Supabase not initialized');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existingLike) {
            // Unlike
            await supabase.from('post_likes').delete().eq('id', existingLike.id);
            // Decrement count via RPC
            await supabase.rpc('decrement_likes', { post_id: postId });
            return { success: true, liked: false };
        } else {
            // Like
            await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
            // Increment count via RPC
            await supabase.rpc('increment_likes', { post_id: postId });
            return { success: true, liked: true };
        }
    },
    getComments: async (postId: string) => {
        if (IS_DEMO_MODE) return { comments: [] };
        if (!supabase) throw new Error('Supabase not initialized');

        const { data, error } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { comments: data || [] };
    },
    createComment: async (postId: string, content: string) => {
        if (IS_DEMO_MODE) return { success: true };
        if (!supabase) throw new Error('Supabase not initialized');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                user_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown Farmer',
                content
            })
            .select()
            .single();

        if (error) throw error;

        // Increment comment count via RPC
        await supabase.rpc('increment_comments', { post_id: postId });

        return { success: true, comment: data };
    }
};

export const chatApi = {
    sendMessage: async (message: string) => {
        return fetchWithAuth('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    },
};

export default {
    scan: scanApi,
    usage: usageApi,
    payment: paymentApi,
    history: historyApi,
    chat: chatApi,
    community: communityApi,
};
