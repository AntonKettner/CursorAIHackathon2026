import { Pool, QueryResult } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

let initPromise: Promise<void> | null = null

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversation_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agent_id VARCHAR(255) NOT NULL,
      started_at TIMESTAMP DEFAULT NOW(),
      ended_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      source VARCHAR(20) NOT NULL CHECK (source IN ('user', 'assistant')),
      timestamp TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      modified JSONB DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      modified JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done'))
    );

    CREATE INDEX IF NOT EXISTS idx_conversation_sessions_project_id ON conversation_sessions(project_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_sessions_agent_id ON conversation_sessions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_notes_project_id ON notes(project_id);
    CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id);
    CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
  `)

  console.log("Database tables initialized")
}

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase()
  }
  return initPromise
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function query(text: string, params?: any[]): Promise<QueryResult<any>> {
  await ensureInitialized()
  return pool.query(text, params)
}

export { pool, query, ensureInitialized }
