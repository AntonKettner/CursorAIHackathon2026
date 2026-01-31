import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET /api/projects - List all projects with session count
export async function GET() {
  try {
    const result = await query(`
      SELECT
        p.id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        COUNT(cs.id) as session_count
      FROM projects p
      LEFT JOIN conversation_sessions cs ON cs.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)

    const projects = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sessionCount: parseInt(row.session_count, 10),
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO projects (id, name, description, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       RETURNING id, name, description, created_at, updated_at`,
      [name.trim(), description?.trim() || null]
    )

    const project = result.rows[0]

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
