import { type NextRequest, NextResponse } from "next/server"

/**
 * Remedies API Route (Proxy to Hugging Face ML Service)
 * 
 * This route allows the mobile app to fetch detailed disease remedies
 * from the central ML brain, maintaining machine independence.
 */

export async function POST(request: NextRequest) {
  try {
    const { disease_name } = await request.json()
    
    if (!disease_name) {
      return NextResponse.json({ error: "Disease name is required" }, { status: 400 })
    }

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'https://darshandr4-progeny-backend.hf.space'

    console.log(`[Remedies] Fetching remedies for: ${disease_name} from ${ML_SERVICE_URL}`)

    // Forward the request to the Hugging Face backend
    const response = await fetch(`${ML_SERVICE_URL}/remedies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ disease_name }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Remedies] Backend error: ${response.status} - ${errorText}`)
      return NextResponse.json({ 
        error: "Failed to fetch from ML backend",
        details: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error: any) {
    console.error("[Remedies API] Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
