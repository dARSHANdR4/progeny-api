import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    console.log("[Export] Data export request received")

    try {
        const supabase = await createClient()
        const adminSupabase = await createAdminClient()

        // Get current user - Support Bearer Token for mobile and Cookies for web
        let user = null;
        const authHeader = request.headers.get("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const { data: { user: authUser }, error: tokenError } = await supabase.auth.getUser(token);
            if (!tokenError && authUser) {
                user = authUser;
            }
        }

        // Fallback to cookie-based auth
        if (!user) {
            const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
            if (!authError && cookieUser) {
                user = cookieUser;
            }
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = user.id;
        console.log("[Export] Exporting data for user:", userId);

        // Fetch all user data
        const [profileResult, scansResult, subscriptionsResult, postsResult, commentsResult] = await Promise.all([
            adminSupabase.from("profiles").select("*").eq("id", userId).single(),
            adminSupabase.from("scans").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
            adminSupabase.from("subscriptions").select("*").eq("user_id", userId),
            adminSupabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
            adminSupabase.from("post_comments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        ]);

        // Prepare export data
        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                id: userId,
                email: user.email,
                profile: profileResult.data || null,
            },
            scans: scansResult.data || [],
            subscriptions: subscriptionsResult.data || [],
            posts: postsResult.data || [],
            comments: commentsResult.data || [],
            summary: {
                totalScans: scansResult.data?.length || 0,
                totalPosts: postsResult.data?.length || 0,
                totalComments: commentsResult.data?.length || 0,
                activeSubscriptions: subscriptionsResult.data?.filter(s => s.status === 'active').length || 0,
            }
        };

        console.log("[Export] ✅ Data export completed for user:", userId);
        console.log("[Export] Summary:", exportData.summary);

        return NextResponse.json({
            success: true,
            data: exportData,
            message: "Your data has been exported successfully."
        });
    } catch (error: any) {
        console.error("[Export] Export error:", error);
        return NextResponse.json(
            { error: "Failed to export data", details: error.message },
            { status: 500 }
        );
    }
}
