import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const adminSupabase = await createAdminClient()

        // 1. Verify Authentication
        let user = null;
        const authHeader = request.headers.get("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const { data: { user: authUser }, error: tokenError } = await supabase.auth.getUser(token);
            if (!tokenError && authUser) {
                user = authUser;
            }
        }

        if (!user) {
            const { data: { user: cookieUser } } = await supabase.auth.getUser()
            user = cookieUser
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Get Post ID from search params
        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')

        if (!postId) {
            return NextResponse.json({ error: "Missing postId" }, { status: 400 })
        }

        // 3. Fetch Comments
        const { data: comments, error: commentsError } = await adminSupabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (commentsError) {
            console.error("[Community API] Error fetching comments:", commentsError)
            return NextResponse.json({ error: "Error fetching comments" }, { status: 500 })
        }

        if (!comments || comments.length === 0) {
            return NextResponse.json({ comments: [] })
        }

        // 4. Fetch author roles in bulk
        const userIds = [...new Set(comments.map(c => c.user_id))];

        const { data: profiles } = await adminSupabase
            .from('profiles')
            .select('id, is_admin')
            .in('id', userIds);

        const { data: subs } = await adminSupabase
            .from('subscriptions')
            .select('user_id, status')
            .in('user_id', userIds)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString());

        const isAdminMap = new Map(profiles?.map(p => [p.id, p.is_admin]) || []);
        const isPremiumMap = new Map(subs?.map(s => [s.user_id, true]) || []);

        // 5. Assembly
        const commentsWithRoles = comments.map(c => ({
            ...c,
            is_admin: isAdminMap.get(c.user_id) || false,
            is_premium: isPremiumMap.has(c.user_id)
        }));

        return NextResponse.json({ comments: commentsWithRoles });

    } catch (error) {
        console.error("[Community API] Unexpected error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
