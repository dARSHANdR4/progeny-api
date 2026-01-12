import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// @ts-ignore
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    // @ts-ignore
    apiVersion: "2025-08-27.basil",
})

export async function POST(request: NextRequest) {
    console.log("[Webhook] Stripe webhook received")

    try {
        const body = await request.text()
        console.log("[Webhook] Body length:", body.length)

        // Check if webhook secret is configured
        const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET
        console.log("[Webhook] STRIPE_WEBHOOK_SECRET configured:", hasWebhookSecret)

        const sig = request.headers.get('stripe-signature')
        console.log("[Webhook] Signature present:", !!sig)

        let event: Stripe.Event

        if (sig && process.env.STRIPE_WEBHOOK_SECRET) {
            // Production: Verify webhook signature
            try {
                event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
                console.log("[Webhook] Signature verified successfully")
            } catch (err: any) {
                console.error("[Webhook] Signature verification failed:", err.message)
                return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
            }
        } else {
            // Development/Test: Parse body directly (ALSO works if secret not configured)
            console.log("[Webhook] No signature verification (dev mode or missing secret)")
            event = JSON.parse(body)
        }

        console.log("[Webhook] Event type:", event.type)

        const supabase = await createAdminClient()

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session
            const { user_id, scans, duration_days, plan_type } = session.metadata || {}

            console.log("[Webhook] Session ID:", session.id)
            console.log("[Webhook] Metadata:", { user_id, scans, duration_days, plan_type })

            if (!user_id || !scans || !duration_days) {
                console.error("[Webhook] Missing required metadata in session:", session.id)
                return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
            }

            // Calculate expiry date
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + Number.parseInt(duration_days))

            console.log("[Webhook] Creating subscription for user:", user_id, "Expires:", expiresAt.toISOString())

            // Create or update subscription
            const { error } = await supabase.from("subscriptions").upsert({
                user_id,
                stripe_subscription_id: session.id,
                stripe_customer_id: session.customer,
                status: "active",
                scans_remaining: Number.parseInt(scans),
                expires_at: expiresAt.toISOString(),
                plan_type: plan_type || "premium_monthly",
                updated_at: new Date().toISOString(),
            })

            if (error) {
                console.error("[Webhook] Error updating subscription:", error)
                return NextResponse.json({ error: "Error updating subscription" }, { status: 500 })
            }

            console.log("[Webhook] ✅ Subscription activated successfully for user:", user_id)
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error("[Webhook] Unexpected error:", error.message)
        return NextResponse.json({ error: "Webhook error" }, { status: 400 })
    }
}