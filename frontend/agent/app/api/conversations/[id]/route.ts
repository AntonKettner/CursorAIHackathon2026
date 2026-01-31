import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/conversations/[id] - Get single session with messages
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const sessionResult = await pool.query(
      `SELECT id, agent_id, started_at, ended_at
       FROM conversation_sessions
       WHERE id = $1`,
      [id]
    )

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult.rows[0]

    const messagesResult = await pool.query(
      `SELECT id, content, source, timestamp
       FROM conversation_messages
       WHERE session_id = $1
       ORDER BY timestamp ASC`,
      [id]
    )

    return NextResponse.json({
      id: session.id,
      agentId: session.agent_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      messages: messagesResult.rows.map((m) => ({
        id: m.id,
        content: m.content,
        source: m.source,
        timestamp: m.timestamp,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch session:", error)
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 })
  }
}

// DELETE /api/conversations/[id] - Delete session (messages cascade)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Delete messages first (or rely on CASCADE if set up)
    await pool.query(`DELETE FROM conversation_messages WHERE session_id = $1`, [id])
    await pool.query(`DELETE FROM conversation_sessions WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete session:", error)
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}
