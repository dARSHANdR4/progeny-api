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

    // 2. Fetch all data in PARALLEL
    const [postsResult, myLikesResult] = await Promise.all([
      // Main posts query with NESTED joins: Posts -> Profiles -> Subscriptions
      adminSupabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(
            id, 
            full_name,
            is_admin,
            subscription:subscriptions!subscriptions_user_id_fkey(
              status, 
              expires_at
            )
          ),
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
      console.error("[Community API] CRITICAL ERROR fetching posts:", JSON.stringify(postsResult.error, null, 2))
      return NextResponse.json({
        error: "Error fetching posts",
        details: postsResult.error.message,
        hint: "Run the UPDATED SQL in community_fix_plan.md"
      }, { status: 500 })
    }

    const posts = postsResult.data || [];
    const myLikes = myLikesResult.data || [];
    const likedPostIds = new Set(myLikes.map(l => l.post_id));

    console.log(`[Community API] Found ${posts.length} posts for user ${user.id}`);

    if (!posts || posts.length === 0) {
      console.warn('[Community API] No posts found - returning empty array');
      return NextResponse.json({ posts: [] })
    }

    // 3. Process posts with pre-fetched nested data
    const now = new Date().toISOString();
    const postsWithRoles = posts.map((post: any) => {
      // Profiles is an object (or null) because of the !foreign_key hint
      const author = post.author;
      // Subscriptions is usually an array in Supabase joins
      const sub = Array.isArray(author?.subscription) ? author.subscription[0] : author?.subscription;

      const isPremium = sub?.status === 'active' && (sub?.expires_at ? sub.expires_at >= now : true);

      return {
        id: post.id,
        user_id: post.user_id,
        author_name: author?.full_name || post.user_name || 'Anonymous',
        content: post.content,
        image_url: post.image_url,
        created_at: post.created_at,
        is_admin: author?.is_admin || false,
        is_premium: isPremium,
        user_liked: likedPostIds.has(post.id),
        likes_count: post.likes?.length || post.likes_count || 0,
        comments_count: post.comments?.length || post.comments_count || 0
      };
    });

    return NextResponse.json({ posts: postsWithRoles });

  } catch (error) {
    console.error("[Community API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

