import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/projects/[id] - Get single project
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT id, name, description, created_at, updated_at
       FROM projects
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = result.rows[0]

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    })
  } catch (error) {
    console.error("Failed to fetch project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { name, description } = await request.json()

    const updates: string[] = []
    const values: (string | null)[] = []
    let paramIndex = 1

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 })
      }
      updates.push(`name = $${paramIndex++}`)
      values.push(name.trim())
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description?.trim() || null)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE projects
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, name, description, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = result.rows[0]

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    })
  } catch (error) {
    console.error("Failed to update project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project (cascades to sessions/messages)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Delete all messages for sessions in this project
    await query(
      `DELETE FROM conversation_messages
       WHERE session_id IN (SELECT id FROM conversation_sessions WHERE project_id = $1)`,
      [id]
    )

    // Delete all sessions in this project
    await query(`DELETE FROM conversation_sessions WHERE project_id = $1`, [id])

    // Delete the project
    await query(`DELETE FROM projects WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
