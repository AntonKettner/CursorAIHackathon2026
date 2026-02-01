import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/todos/[id] - Get single todo
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT id, project_id, content, created_at, modified, status
       FROM todos
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

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
    console.error("Failed to fetch todo:", error)
    return NextResponse.json({ error: "Failed to fetch todo" }, { status: 500 })
  }
}

// PUT /api/todos/[id] - Update todo (content and/or status)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { content, status } = await request.json()

    if (status && !["open", "done"].includes(status)) {
      return NextResponse.json({ error: "status must be 'open' or 'done'" }, { status: 400 })
    }

    // First get the current todo to preserve modification history
    const currentResult = await query(
      `SELECT content, status, modified FROM todos WHERE id = $1`,
      [id]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const current = currentResult.rows[0]
    const modified = current.modified || []

    // Add current state to modification history
    modified.push({
      content: current.content,
      status: current.status,
      modifiedAt: new Date().toISOString(),
    })

    const result = await query(
      `UPDATE todos
       SET content = COALESCE($2, content),
           status = COALESCE($3, status),
           modified = $4
       WHERE id = $1
       RETURNING id, project_id, content, created_at, modified, status`,
      [id, content, status, JSON.stringify(modified)]
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
    console.error("Failed to update todo:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

// DELETE /api/todos/[id] - Delete todo
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    await query(`DELETE FROM todos WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete todo:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
