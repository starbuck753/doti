export type EntityId = string
export type Language = 'en' | 'es'
export type Theme = 'system' | 'light' | 'dark'
export type AccentColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'teal'
export type TaskStatus = 'active' | 'completed' | 'archived'
export type TaskBucket = 'today' | 'later'
export type PriorityLevel = 1 | 2 | 3 | 4

export interface Task {
  id: EntityId
  title: string
  status: TaskStatus
  bucket: TaskBucket
  priorityBase: PriorityLevel
  priorityAgingStartedAt: string
  description: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Note {
  id: EntityId
  title: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Birthday {
  id: EntityId
  name: string
  month: number
  day: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface TaskNoteLink {
  id: EntityId
  taskId: EntityId
  noteId: EntityId
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Settings {
  id: 'app'
  language: Language
  theme: Theme
  accentColor: AccentColor
  priorityAgingEnabled: boolean
  priorityAgingIntervalDays: number
  updatedAt: string
}
