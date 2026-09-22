import { useCallback, useEffect, useState } from 'react'
import type { Note } from '../../domain/models'
import { noteRepository } from './noteRepository'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const refresh = useCallback(async () => setNotes(await noteRepository.list()), [])
  useEffect(() => { void refresh() }, [refresh])
  return {
    notes,
    refresh,
    createNote: async (title: string) => { const note = await noteRepository.create(title); await refresh(); return note },
  }
}
