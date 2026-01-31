import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// GET /api/conversations - List all sessions with messages
export async function GET() {
  try {
    const sessionsResult = await pool.query(`
      SELECT id, agent_id, started_at, ended_at
      FROM conversation_sessions
      ORDER BY started_at DESC
    `)

    const sessions = await Promise.all(
      sessionsResult.rows.map(async (session) => {
        const messagesResult = await pool.query(
          `SELECT id, content, source, timestamp
           FROM conversation_messages
           WHERE session_id = $1
           ORDER BY timestamp ASC`,
          [session.id]
        )

        return {
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
        }
      })
    )

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Failed to fetch sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

// POST /api/conversations - Create new session
export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO conversation_sessions (id, agent_id, started_at)
       VALUES (gen_random_uuid(), $1, NOW())
       RETURNING id, agent_id, started_at`,
      [agentId]
    )

    const session = result.rows[0]

    return NextResponse.json({
      id: session.id,
      agentId: session.agent_id,
      startedAt: session.started_at,
    })
  } catch (error) {
    console.error("Failed to create session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
