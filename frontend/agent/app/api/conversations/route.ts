import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET /api/conversations - List sessions with messages (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let sessionsQuery = `
      SELECT id, project_id, agent_id, started_at, ended_at
      FROM conversation_sessions
    `
    const queryParams: string[] = []

    if (projectId) {
      sessionsQuery += ` WHERE project_id = $1`
      queryParams.push(projectId)
    }

    sessionsQuery += ` ORDER BY started_at DESC`

    const sessionsResult = await query(sessionsQuery, queryParams)

    const sessions = await Promise.all(
      sessionsResult.rows.map(async (session) => {
        const messagesResult = await query(
          `SELECT id, content, source, timestamp
           FROM conversation_messages
           WHERE session_id = $1
           ORDER BY timestamp ASC`,
          [session.id]
        )

        return {
          id: session.id,
          projectId: session.project_id,
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
    const { agentId, projectId } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO conversation_sessions (id, project_id, agent_id, started_at)
       VALUES (gen_random_uuid(), $1, $2, NOW())
       RETURNING id, project_id, agent_id, started_at`,
      [projectId, agentId]
    )

    const session = result.rows[0]

    return NextResponse.json({
      id: session.id,
      projectId: session.project_id,
      agentId: session.agent_id,
      startedAt: session.started_at,
    })
  } catch (error) {
    console.error("Failed to create session:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
