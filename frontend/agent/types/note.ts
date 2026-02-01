export interface Note {
  id: string
  projectId: string
  title: string
  content: string
  createdAt: Date
  modified: Date[]
}

export interface Todo {
  id: string
  projectId: string
  content: string
  createdAt: Date
  status: "open" | "done"
  modified: Date[]
}
