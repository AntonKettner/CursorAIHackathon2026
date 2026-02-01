import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/conversations/[id]/end - End session
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const endedAt = new Date().toISOString()
    const result = await query(
      `UPDATE conversation_sessions
       SET ended_at = $2::timestamptz
       WHERE id = $1
       RETURNING id, ended_at`,
      [id, endedAt]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: result.rows[0].id,
      endedAt: result.rows[0].ended_at,
    })
  } catch (error) {
    console.error("Failed to end session:", error)
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 })
  }
}
