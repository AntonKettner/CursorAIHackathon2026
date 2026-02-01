import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET /api/notes - List notes (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let notesQuery = `
      SELECT id, project_id, title, content, created_at, modified
      FROM notes
    `
    const queryParams: string[] = []

    if (projectId) {
      notesQuery += ` WHERE project_id = $1`
      queryParams.push(projectId)
    }

    notesQuery += ` ORDER BY created_at DESC`

    const result = await query(notesQuery, queryParams)

    const notes = result.rows.map((note) => ({
      id: note.id,
      projectId: note.project_id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      modified: note.modified || [],
    }))

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Failed to fetch notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

// POST /api/notes - Create new note
export async function POST(request: NextRequest) {
  try {
    const { projectId, title, content } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const createdAt = new Date().toISOString()
    const result = await query(
      `INSERT INTO notes (id, project_id, title, content, created_at, modified)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::timestamptz, '[]'::jsonb)
       RETURNING id, project_id, title, content, created_at, modified`,
      [projectId, title, content, createdAt]
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
    console.error("Failed to create note:", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}
