import { useCallback, useEffect, useState } from 'react'
import type { Note } from '../../domain/models'
import { noteRepository } from './noteRepository'

export function useNoteDetail(id: string | undefined) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => { if (!id) { setLoading(false); return }; setNote((await noteRepository.get(id)) ?? null); setLoading(false) }, [id])
  useEffect(() => { void refresh() }, [refresh])
  const update = async (changes: Partial<Pick<Note, 'title' | 'content'>>) => { if (note) setNote(await noteRepository.update(note, changes)) }
  return { note, loading, update, deleteNote: async () => { if (note) await noteRepository.delete(note) } }
}
