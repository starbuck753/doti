export type EntityId = string
export type Language = 'en' | 'es'
export type Theme = 'system' | 'light' | 'dark'
export type AccentColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'teal'
export type TaskStatus = 'active' | 'completed' | 'archived'
export type TaskBucket = 'today' | 'later'
export type PriorityLevel = 1 | 2 | 3 | 4
export type HabitFrequency = 'daily' | 'weekdays'
export type HabitColor = 'neutral' | 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'teal'
export type HabitIcon = 'circle-checked-big' | 'sparkles' | 'heart' | 'book' | 'activity' | 'dumbbell' | 'footprints' | 'glass-water' | 'moon' | 'sun' | 'coffee' | 'leaf' | 'brain' | 'apple' | 'bed' | 'music' | 'gamepad2' | 'pencil'

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

export interface Habit {
  id: EntityId
  name: string
  icon: HabitIcon
  color: HabitColor
  frequency: HabitFrequency
  weekdays: number[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface HabitCheck {
  id: EntityId
  habitId: EntityId
  date: string
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
  showHabitsOnDashboard: boolean
  updatedAt: string
}
