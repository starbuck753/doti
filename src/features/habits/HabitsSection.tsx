import { useState } from 'react'
import { Circle, CircleCheck, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Habit, HabitFrequency } from '../../domain/models'
import { habitRepository } from './habitRepository'
import { useHabits } from './useHabits'

function HabitEditor({ habit, onClose, onSaved }: { habit: Habit; onClose: () => void; onSaved: () => void }) {
  const { t, i18n } = useTranslation()
  const [name, setName] = useState(habit.name)
  const [frequency, setFrequency] = useState<HabitFrequency>(habit.frequency)
  const [weekdays, setWeekdays] = useState<number[]>(habit.weekdays)
  const weekdayNumbers = [1, 2, 3, 4, 5, 6, 0]
  const labels = i18n.t('habits.weekdayShort', { returnObjects: true }) as string[]
  const save = async () => { if (!name.trim() || (frequency === 'weekdays' && weekdays.length === 0)) return; await habitRepository.update(habit, name, frequency, weekdays); onSaved(); onClose() }
  const remove = async () => { if (!window.confirm(t('habits.confirmDelete'))) return; await habitRepository.delete(habit); onSaved(); onClose() }
  return <div className="habit-modal-backdrop" role="presentation" onMouseDown={(event: { target: EventTarget; currentTarget: EventTarget }) => { if (event.target === event.currentTarget) onClose() }}><section className="habit-editor" role="dialog" aria-modal="true" aria-labelledby="habit-editor-title"><h2 id="habit-editor-title">{t('habits.edit')}</h2><label>{t('habits.name')}<input autoFocus value={name} onChange={(event: { target: HTMLInputElement }) => setName(event.target.value)} /></label><fieldset><legend>{t('habits.repeat')}</legend><label className="habit-radio"><input type="radio" checked={frequency === 'daily'} onChange={() => setFrequency('daily')} />{t('habits.daily')}</label><label className="habit-radio"><input type="radio" checked={frequency === 'weekdays'} onChange={() => setFrequency('weekdays')} />{t('habits.selectedDays')}</label>{frequency === 'weekdays' && <div className="habit-weekdays">{labels.map((label, index) => { const day = weekdayNumbers[index]; return <button type="button" key={day} aria-pressed={weekdays.includes(day)} aria-label={new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(new Date(2024, 0, 7 + day))} onClick={() => setWeekdays(weekdays.includes(day) ? weekdays.filter((value: number) => value !== day) : [...weekdays, day])}>{label}</button> })}</div>}</fieldset><div className="habit-editor-actions"><button className="habit-delete" onClick={() => void remove()}>{t('habits.delete')}</button><button onClick={onClose}>{t('habits.cancel')}</button><button className="habit-save" disabled={!name.trim() || (frequency === 'weekdays' && weekdays.length === 0)} onClick={() => void save()}>{t('habits.save')}</button></div></section></div>
}

export function HabitsSection() {
  const { t } = useTranslation()
  const { habits, allHabits, checks, refresh, date } = useHabits()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Habit | null>(null)
  const checked = new Set(checks.map((check) => check.habitId))
  const add = async () => { if (!name.trim()) return; await habitRepository.create(name); setName(''); setAdding(false); await refresh() }
  return <section className="task-section habits-section"><div className="section-heading"><h2>{t('habits.title')}</h2><button type="button" className="add-button" aria-label={t('habits.add')} onClick={() => setAdding(true)}><Plus aria-hidden="true" /></button></div>
    {adding && <input autoFocus className="quick-add" value={name} placeholder={t('habits.name')} onChange={(event: { target: HTMLInputElement }) => setName(event.target.value)} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void add(); if (event.key === 'Escape') setAdding(false) }} />}
    {habits.length === 0 ? <p className="habit-empty">{allHabits.length ? t('habits.nothingToday') : t('habits.empty')}</p> : <div className="habit-list">{habits.map((habit) => { const isChecked = checked.has(habit.id); return <div className="habit-row" key={`${date}-${habit.id}`}><button type="button" className={`habit-check ${isChecked ? 'checked' : ''}`} role="checkbox" aria-checked={isChecked} aria-label={t(isChecked ? 'habits.uncheck' : 'habits.check', { name: habit.name })} onClick={async () => { await habitRepository.setChecked(habit.id, date, !isChecked); await refresh() }}>{isChecked ? <CircleCheck aria-hidden="true" /> : <Circle aria-hidden="true" />}</button><button type="button" className="habit-name" onClick={() => setEditing(habit)}>{habit.name}</button></div> })}</div>}
    {editing && <HabitEditor habit={editing} onClose={() => setEditing(null)} onSaved={() => void refresh()} />}
  </section>
}
