import { createClient, createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
    console.log("[Account] Delete account request received")

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
                console.log("[Account] User authenticated via Bearer token:", user.id);
            }
        }

        // Fallback to cookie-based auth
        if (!user) {
            const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
            if (!authError && cookieUser) {
                user = cookieUser;
                console.log("[Account] User authenticated via cookie:", user.id);
            }
        }

        if (!user) {
            console.error("[Account] No user found")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = user.id;
        console.log("[Account] Deleting all data for user:", userId);

        // Delete user data in order (respecting foreign key constraints)
        const deleteTasks = [
            // 1. Delete post comments
            adminSupabase.from("post_comments").delete().eq("user_id", userId),
            // 2. Delete post likes
            adminSupabase.from("post_likes").delete().eq("user_id", userId),
            // 3. Delete posts
            adminSupabase.from("posts").delete().eq("user_id", userId),
            // 4. Delete scans
            adminSupabase.from("scans").delete().eq("user_id", userId),
            // 5. Delete daily usage
            adminSupabase.from("daily_usage").delete().eq("user_id", userId),
            // 6. Delete subscriptions
            adminSupabase.from("subscriptions").delete().eq("user_id", userId),
            // 7. Delete profile
            adminSupabase.from("profiles").delete().eq("id", userId),
        ];

        // Execute all delete operations
        const results = await Promise.allSettled(deleteTasks);

        // Log results
        const tableNames = ["post_comments", "post_likes", "posts", "scans", "daily_usage", "subscriptions", "profiles"];
        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                console.log(`[Account] Deleted from ${tableNames[index]}: success`);
            } else {
                console.error(`[Account] Error deleting from ${tableNames[index]}:`, result.reason);
            }
        });

        // Delete the user from Supabase Auth
        try {
            const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(userId);
            if (deleteAuthError) {
                console.error("[Account] Error deleting auth user:", deleteAuthError);
                // Continue even if auth deletion fails - data is already deleted
            } else {
                console.log("[Account] Auth user deleted successfully");
            }
        } catch (authDeleteError) {
            console.error("[Account] Exception deleting auth user:", authDeleteError);
        }

        console.log("[Account] ✅ Account deletion completed for user:", userId);

        return NextResponse.json({
            success: true,
            message: "Your account and all associated data have been permanently deleted.",
        });
    } catch (error: any) {
        console.error("[Account] Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete account", details: error.message },
            { status: 500 }
        );
    }
}
