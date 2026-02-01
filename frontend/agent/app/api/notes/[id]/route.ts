import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/notes/[id] - Get single note
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const result = await query(
      `SELECT id, project_id, title, content, created_at, modified
       FROM notes
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const note = result.rows[0]

    return NextResponse.json({
      id: note.id,
      projectId: note.project_id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      modified: note.modified || [],
    })
  } catch (error) {
    console.error("Failed to fetch note:", error)
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 })
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { title, content } = await request.json()

    // First get the current note to preserve modification history
    const currentResult = await query(
      `SELECT title, content, modified FROM notes WHERE id = $1`,
      [id]
    )

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const current = currentResult.rows[0]
    const modified = current.modified || []

    // Add current state to modification history
    modified.push({
      title: current.title,
      content: current.content,
      modifiedAt: new Date().toISOString(),
    })

    const result = await query(
      `UPDATE notes
       SET title = COALESCE($2, title),
           content = COALESCE($3, content),
           modified = $4
       WHERE id = $1
       RETURNING id, project_id, title, content, created_at, modified`,
      [id, title, content, JSON.stringify(modified)]
    )

    const note = result.rows[0]

    return NextResponse.json({
      id: note.id,
      projectId: note.project_id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      modified: note.modified || [],
    })
  } catch (error) {
    console.error("Failed to update note:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    await query(`DELETE FROM notes WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete note:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
