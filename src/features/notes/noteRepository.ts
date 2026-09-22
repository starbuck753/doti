import { db } from '../../data/db'
import type { Note } from '../../domain/models'

const timestamp = () => new Date().toISOString()

export const noteRepository = {
  async list() {
    const notes = await db.notes.filter((note) => note.deletedAt === null || note.deletedAt === undefined).toArray()
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  async get(id: string) { return db.notes.get(id) },
  async create(title: string) {
    const now = timestamp()
    const note: Note = { id: crypto.randomUUID(), title: title.trim(), content: '', createdAt: now, updatedAt: now, deletedAt: null }
    await db.notes.add(note)
    return note
  },
  async update(note: Note, changes: Partial<Pick<Note, 'title' | 'content'>>) {
    const updated = { ...note, ...changes, updatedAt: timestamp() }
    await db.notes.put(updated)
    return updated
  },
  async delete(note: Note) {
    const deletedAt = timestamp()
    const updated = { ...note, deletedAt, updatedAt: deletedAt }
    await db.notes.put(updated)
    return updated
  },
}
