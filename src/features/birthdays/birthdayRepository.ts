import { db } from '../../data/db'
import type { Birthday } from '../../domain/models'
import { notifyLocalChange } from '../../sync/signals'

const timestamp = () => new Date().toISOString()

export const birthdayRepository = {
  async list() { return db.birthdays.filter((birthday) => birthday.deletedAt === null || birthday.deletedAt === undefined).toArray() },
  async create(name: string, month: number, day: number) {
    const now = timestamp()
    const birthday: Birthday = { id: crypto.randomUUID(), name: name.trim(), month, day, createdAt: now, updatedAt: now, deletedAt: null }
    await db.birthdays.add(birthday); notifyLocalChange()
    return birthday
  },
  async update(birthday: Birthday, changes: Pick<Birthday, 'name' | 'month' | 'day'>) {
    const updated = { ...birthday, ...changes, updatedAt: timestamp() }
    await db.birthdays.put(updated); notifyLocalChange()
    return updated
  },
  async delete(birthday: Birthday) {
    const updated = { ...birthday, deletedAt: timestamp(), updatedAt: timestamp() }
    await db.birthdays.put(updated); notifyLocalChange()
    return updated
  },
}
