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

    // 2. Fetch all data in PARALLEL (reduces from ~500ms to ~150ms)
    const [postsResult, myLikesResult] = await Promise.all([
      // Main posts query WITH joins for performance
      adminSupabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(id, is_admin),
          subscription:subscriptions(user_id, status, expires_at),
          likes:post_likes(id),
          comments:post_comments(id)
        `)
        .order('created_at', { ascending: false }),

      // User's likes in parallel
      adminSupabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
    ]);

    if (postsResult.error) {
      console.error("[Community API] Error fetching posts:", postsResult.error)
      return NextResponse.json({ error: "Error fetching posts" }, { status: 500 })
    }

    const posts = postsResult.data || [];
    const myLikes = myLikesResult.data || [];
    const likedPostIds = new Set(myLikes.map(l => l.post_id));

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    // 3. Process posts with pre-fetched data
    const now = new Date().toISOString();
    const postsWithRoles = posts.map((post: any) => {
      const sub = post.subscription?.[0];
      const isPremium = sub?.status === 'active' && sub?.expires_at >= now;

      return {
        id: post.id,
        user_id: post.user_id,
        author_name: post.author_name,
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        is_admin: post.author?.[0]?.is_admin || false,
        is_premium: isPremium,
        user_liked: likedPostIds.has(post.id),
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0
      };
    });

    return NextResponse.json({ posts: postsWithRoles });

  } catch (error) {
    console.error("[Community API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

