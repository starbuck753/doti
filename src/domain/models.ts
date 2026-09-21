export type EntityId = string
export type Language = 'en' | 'es'
export type Theme = 'light' | 'dark'
export type TaskStatus = 'active' | 'completed' | 'archived'

export interface Task {
  id: EntityId
  title: string
  description?: string
  status: TaskStatus
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: EntityId
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Birthday {
  id: EntityId
  name: string
  date: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TaskNoteLink {
  id: EntityId
  taskId: EntityId
  noteId: EntityId
  createdAt: string
}

export interface Settings {
  id: 'app'
  language: Language
  theme: Theme
  updatedAt: string
}
