import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Full System & Developer Prompts from documentation
const SYSTEM_PROMPT = `
# CORE IDENTITY: PROGENITURE AI
You are Progeniture AI, the specialized agricultural expert built for the Progeny platform. 
You are NOT a generic LLM, assistant, or "computer program". You are a dedicated plant pathologist and farming advisor.

## YOUR MISSION
Support farmers by diagnosing plant diseases and providing actionable, step-by-step recovery plans. 
Focus strictly on:
- Disease identification and explanation.
- Organic and chemical treatment options (always prioritize safety).
- Preventive farming practices and seasonal advice.
- Yield protection and field management.

## PERSONALITY & CONTEXT
- If asked "Who are you?", identify as Progeniture AI, the agricultural core of the Progeny platform.
- Never mention being a generic AI. You are a field-ready expert.
- Tone: Empathetic to the hard work of farmers, direct, professional, and practical.

## OPERATION RULES
1. RESPONSE FORMAT: Plain text only. NO markdown (no **, no #), NO emojis.
2. CONCISENESS: 6 steps maximum per response. 
3. SAFETY: Always advise checking with local experts for high-severity issues. Never specify exact chemical dosages; suggest consulting labels.
4. SCOPE: If asked questions completely unrelated to agriculture, politely redirect the user back to their farm and plant health.
`;

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

    // Fallback to cookie-based auth if no token or token invalid
    if (!user) {
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      user = cookieUser;
    }

    if (!user) {
      console.error("[ChatAPI] Authentication failed: No valid user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Request
    const { message } = await request.json()
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // 3. Call AI Service (Prioritize Groq, Fallback to Gemini)
    const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim() || process.env.GROQ_LLM_KEY?.trim()
    const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY?.trim()

    if (GROQ_API_KEY) {
      console.log("[ChatAPI] Using Groq AI (Llama 3.3)...")
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: SYSTEM_PROMPT.trim() },
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        })

        if (groqResponse.ok) {
          const data = await groqResponse.json()
          const botResponse = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
          return NextResponse.json({ response: botResponse, success: true, provider: "groq" })
        } else {
          const errorData = await groqResponse.json()
          console.error("[ChatAPI] Groq error, falling back to Gemini:", JSON.stringify(errorData).substring(0, 500))
        }
      } catch (e) {
        console.error("[ChatAPI] Groq fetch failed, falling back to Gemini:", e)
      }
    }

    // --- Gemini Fallback ---
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "No AI service configured on server" }, { status: 500 })
    }

    console.log("[ChatAPI] Using Gemini Fallback...")
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Instruction: ${SYSTEM_PROMPT.trim()}\n\nUser Question: ${message}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        console.error("[ChatAPI] Gemini Fallback Error:", JSON.stringify(data).substring(0, 500))
        return NextResponse.json({
          error: "All AI services rejected the request",
          details: data.error?.message || "Rate limit or quota issue",
        }, { status: response.status })
      }

      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response."
      return NextResponse.json({ response: botResponse, success: true, provider: "gemini" })

    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error("[ChatAPI] Final catch-all error:", err)
      return NextResponse.json({ error: "AI service timed out or failed. Please try again." }, { status: 504 })
    }
  } catch (error) {
    console.error("[ChatAPI] Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
