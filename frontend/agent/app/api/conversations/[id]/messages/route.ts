import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/conversations/[id]/messages - Add message to session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params
    const { content, source } = await request.json()

    if (!content || !source) {
      return NextResponse.json(
        { error: "content and source are required" },
        { status: 400 }
      )
    }

    if (source !== "user" && source !== "assistant") {
      return NextResponse.json(
        { error: "source must be 'user' or 'assistant'" },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO conversation_messages (id, session_id, content, source, timestamp)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, timestamp`,
      [sessionId, content, source]
    )

    const message = result.rows[0]

    return NextResponse.json({
      id: message.id,
      timestamp: message.timestamp,
    })
  } catch (error) {
    console.error("Failed to add message:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
