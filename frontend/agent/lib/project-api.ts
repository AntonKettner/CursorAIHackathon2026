import type { Project } from "@/types/project"

const API_BASE = "/api/projects"

export async function getAllProjects(): Promise<Project[]> {
  const response = await fetch(API_BASE)

  if (!response.ok) {
    throw new Error("Failed to fetch projects")
  }

  const data = await response.json()

  return data.map(
    (project: {
      id: string
      name: string
      description?: string
      createdAt: string
      updatedAt: string
      sessionCount: number
    }) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      sessionCount: project.sessionCount,
    })
  )
}

export async function getProject(id: string): Promise<Project | undefined> {
  const response = await fetch(`${API_BASE}/${id}`)

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error("Failed to fetch project")
  }

  const data = await response.json()

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }
}

export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    throw new Error("Failed to create project")
  }

  const data = await response.json()

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }
}

export async function updateProject(
  id: string,
  updates: { name?: string; description?: string }
): Promise<Project> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error("Failed to update project")
  }

  const data = await response.json()

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }
}

export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete project")
  }
}
