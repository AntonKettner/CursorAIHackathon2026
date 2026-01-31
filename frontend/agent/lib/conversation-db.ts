import type { ConversationMessage, ConversationSession } from "@/types/conversation"

const DB_NAME = "labasi-conversations"
const DB_VERSION = 1
const STORE_NAME = "sessions"

let dbPromise: Promise<IDBDatabase> | null = null

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("startedAt", "startedAt", { unique: false })
      }
    }
  })

  return dbPromise
}

export async function saveSession(session: ConversationSession): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    // Convert dates to ISO strings for storage
    const sessionToStore = {
      ...session,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString(),
      messages: session.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }

    const request = store.put(sessionToStore)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getSession(id: string): Promise<ConversationSession | undefined> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result
      if (!result) {
        resolve(undefined)
        return
      }

      // Convert ISO strings back to dates
      resolve({
        ...result,
        startedAt: new Date(result.startedAt),
        endedAt: result.endedAt ? new Date(result.endedAt) : undefined,
        messages: result.messages.map((m: { timestamp: string }) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      })
    }
  })
}

export async function getAllSessions(): Promise<ConversationSession[]> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("startedAt")
    const request = index.openCursor(null, "prev") // Sort by most recent first

    const sessions: ConversationSession[] = []

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        const result = cursor.value
        sessions.push({
          ...result,
          startedAt: new Date(result.startedAt),
          endedAt: result.endedAt ? new Date(result.endedAt) : undefined,
          messages: result.messages.map((m: { timestamp: string }) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        })
        cursor.continue()
      } else {
        resolve(sessions)
      }
    }
  })
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function addMessageToSession(
  sessionId: string,
  message: ConversationMessage
): Promise<void> {
  const session = await getSession(sessionId)
  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  session.messages.push(message)
  await saveSession(session)
}
