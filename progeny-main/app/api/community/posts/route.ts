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

    // 2. Fetch Posts
    const { data: posts, error: postsError } = await adminSupabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error("[Community API] Error fetching posts:", postsError)
      return NextResponse.json({ error: "Error fetching posts" }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // 3. Fetch all author profiles and subscriptions in bulk
    const userIds = [...new Set(posts.map(p => p.user_id))];

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

    // 4. Fetch real-time likes and comments counts (optional but accurate)
    const postIds = posts.map(p => p.id);
    const { data: allLikes } = await adminSupabase.from('post_likes').select('post_id').in('post_id', postIds);
    const { data: allComments } = await adminSupabase.from('post_comments').select('post_id').in('post_id', postIds);

    const realLikesMap = new Map();
    const realCommentsMap = new Map();

    allLikes?.forEach(l => {
      realLikesMap.set(l.post_id, (realLikesMap.get(l.post_id) || 0) + 1);
    });
    allComments?.forEach(c => {
      realCommentsMap.set(c.post_id, (realCommentsMap.get(c.post_id) || 0) + 1);
    });

    // 5. Check if CURRENT user liked these posts
    const { data: myLikes } = await adminSupabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    const likedPostIds = new Set(myLikes?.map(l => l.post_id) || []);

    // 6. Assembly
    const postsWithRoles = posts.map(post => ({
      ...post,
      is_admin: isAdminMap.get(post.user_id) || false,
      is_premium: isPremiumMap.has(post.user_id),
      user_liked: likedPostIds.has(post.id),
      likes_count: realLikesMap.get(post.id) || 0,
      comments_count: realCommentsMap.get(post.id) || 0
    }));

    return NextResponse.json({ posts: postsWithRoles });

  } catch (error) {
    console.error("[Community API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
