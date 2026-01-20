import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

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
            const { data: { user: cookieUser } } = await supabase.auth.getUser();
            user = cookieUser;
        }

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Forward to ML Service (Flask)
        const formData = await request.formData()
        const audioFile = formData.get("audio") as File

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
        }

        const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000'

        // Construct new form data for Flask
        const flaskFormData = new FormData()
        flaskFormData.append('audio', audioFile)

        console.log(`[VoiceProxy] Forwarding to ${ML_SERVICE_URL}/api/chat/voice...`)

        const flaskResponse = await fetch(`${ML_SERVICE_URL}/api/chat/voice`, {
            method: "POST",
            body: flaskFormData,
        })

        if (!flaskResponse.ok) {
            const errorText = await flaskResponse.text()
            console.error("[VoiceProxy] Flask error:", errorText)
            return NextResponse.json({ error: "ML Service failed to process voice" }, { status: flaskResponse.status })
        }

        const data = await flaskResponse.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error("[VoiceProxy] Server error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
