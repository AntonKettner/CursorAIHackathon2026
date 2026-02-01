import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET /api/todos - List todos (optionally filtered by projectId and/or status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status")

    let todosQuery = `
      SELECT id, project_id, content, created_at, modified, status
      FROM todos
    `
    const conditions: string[] = []
    const queryParams: string[] = []

    if (projectId) {
      conditions.push(`project_id = $${queryParams.length + 1}`)
      queryParams.push(projectId)
    }

    if (status) {
      conditions.push(`status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }

    if (conditions.length > 0) {
      todosQuery += ` WHERE ${conditions.join(" AND ")}`
    }

    todosQuery += ` ORDER BY created_at DESC`

    const result = await query(todosQuery, queryParams)

    const todos = result.rows.map((todo) => ({
      id: todo.id,
      projectId: todo.project_id,
      content: todo.content,
      createdAt: todo.created_at,
      modified: todo.modified || [],
      status: todo.status,
    }))

    return NextResponse.json(todos)
  } catch (error) {
    console.error("Failed to fetch todos:", error)
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 })
  }
}

// POST /api/todos - Create new todo
export async function POST(request: NextRequest) {
  try {
    const { projectId, content, status = "open" } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    if (status && !["open", "done"].includes(status)) {
      return NextResponse.json({ error: "status must be 'open' or 'done'" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO todos (id, project_id, content, created_at, modified, status)
       VALUES (gen_random_uuid(), $1, $2, NOW(), '[]'::jsonb, $3)
       RETURNING id, project_id, content, created_at, modified, status`,
      [projectId, content, status]
    )

    const todo = result.rows[0]

    return NextResponse.json({
      id: todo.id,
      projectId: todo.project_id,
      content: todo.content,
      createdAt: todo.created_at,
      modified: todo.modified || [],
      status: todo.status,
    })
  } catch (error) {
    console.error("Failed to create todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
