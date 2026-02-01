import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

// POST /api/analyze - Trigger conversation analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, projectId } = body

    if (!sessionId || !projectId) {
      return NextResponse.json(
        { error: "sessionId and projectId are required" },
        { status: 400 }
      )
    }

    // Call backend analyze endpoint
    const response = await fetch(`${BACKEND_URL}/analyze-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, projectId }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Analysis failed" },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to analyze session:", error)
    return NextResponse.json(
      { error: "Failed to analyze session" },
      { status: 500 }
    )
  }
}
