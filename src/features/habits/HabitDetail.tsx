import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, Apple, Bed, BookOpen, Brain, ChevronLeft, Circle, CircleCheckBig, Coffee, Dumbbell, Footprints, Gamepad2, GlassWater, Heart, Leaf, Moon, Music, Pencil, Sparkles, Sun, Trash2 } from 'lucide-react'
import type { Habit, HabitColor, HabitIcon } from '../../domain/models'
import { habitRepository } from './habitRepository'
import { getLocalDateKey, isHabitCompletedForDate } from './habitUtils'

const icons = { 'circle-checked-big': CircleCheckBig, sparkles: Sparkles, heart: Heart, book: BookOpen, activity: Activity, dumbbell: Dumbbell, footprints: Footprints, 'glass-water': GlassWater, moon: Moon, sun: Sun, coffee: Coffee, leaf: Leaf, brain: Brain, apple: Apple, bed: Bed, music: Music, gamepad2: Gamepad2, pencil: Pencil } satisfies Record<HabitIcon, typeof Circle>
const colors: HabitColor[] = ['neutral', 'blue', 'purple', 'pink', 'green', 'orange', 'teal']

export function HabitDetail() {
  const { t } = useTranslation()
  const { habitId } = useParams()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  useEffect(() => { let alive = true; void (async () => { const value = habitId ? await habitRepository.get(habitId) : undefined; const checks = await habitRepository.checksForDate(); if (!alive) return; setHabit(value && !value.deletedAt ? value : null); setName(value?.name ?? ''); setCompleted(value ? isHabitCompletedForDate(checks, value.id, getLocalDateKey()) : false); setLoading(false) })(); return () => { alive = false } }, [habitId])
  const change = async (patch: Partial<Pick<Habit, 'icon' | 'color' | 'frequency' | 'weekdays'>>) => { if (!habit) return; const updated = await habitRepository.update(habit, patch); setHabit(updated) }
  const saveName = async () => { const value = name.trim(); if (!habit) return; if (!value) { setName(habit.name); return }; if (value !== habit.name) setHabit(await habitRepository.update(habit, { name: value })) }
  const toggleToday = async () => { if (!habit) return; await habitRepository.toggle(habit.id); const checks = await habitRepository.checksForDate(); setCompleted(isHabitCompletedForDate(checks, habit.id, getLocalDateKey())) }
  const remove = async () => { if (habit && window.confirm(t('habits.confirmDelete'))) { await habitRepository.delete(habit); navigate('/tasks') } }
  if (loading) return <section className="detail-page"><p className="muted-text">{t('habits.loading')}</p></section>
  if (!habit) return <section className="detail-page not-found"><button className="back-link" onClick={() => navigate('/tasks')}><ChevronLeft aria-hidden="true" />{t('habits.backToTasks')}</button><h1>{t('habits.notFound')}</h1></section>
  return <section className="detail-page habit-detail">
    <button className="back-link" onClick={() => navigate('/tasks')}><ChevronLeft aria-hidden="true" />{t('habits.back')}</button>
    <div className="detail-title-row habit-detail-title"><span className={`habit-mark habit-tint-${habit.color}`}>{(() => { const Icon = icons[habit.icon]; return <Icon size={24} aria-hidden="true" /> })()}</span><input className="detail-title-input" aria-label={t('habits.name')} value={name} onChange={(event: { target: HTMLInputElement }) => setName(event.target.value)} onBlur={() => void saveName()} onKeyDown={(event: { key: string }) => { if (event.key === 'Enter') void saveName(); if (event.key === 'Escape') setName(habit.name) }} /></div>
    <div className="habit-detail-group"><h2>{t('habits.appearance')}</h2><span className="detail-label">{t('habits.icon')}</span><div className="habit-icon-grid" role="group" aria-label={t('habits.icon')}>{(Object.keys(icons) as HabitIcon[]).map((icon) => { const Icon = icons[icon]; return <button key={icon} type="button" aria-label={t(`habits.icons.${icon}`)} aria-pressed={habit.icon === icon} className={`habit-icon-choice ${habit.icon === icon ? 'selected' : ''}`} onClick={() => void change({ icon })}><Icon aria-hidden="true" /></button> })}</div>
      <span className="detail-label">{t('habits.color')}</span><div className="habit-color-grid" role="group" aria-label={t('habits.color')}>{colors.map((color) => <button key={color} type="button" aria-label={t(`habits.colors.${color}`)} aria-pressed={habit.color === color} className={`habit-color-choice habit-color-${color} ${habit.color === color ? 'selected' : ''}`} onClick={() => void change({ color })}><span>{habit.color === color ? '✓' : ''}</span></button>)}</div>
    </div>
    <div className="habit-detail-group"><h2>{t('habits.repeat')}</h2><div className="habit-frequency"><button type="button" className={habit.frequency === 'daily' ? 'selected' : ''} aria-pressed={habit.frequency === 'daily'} onClick={() => void change({ frequency: 'daily', weekdays: [] })}>{t('habits.everyDay')}</button><button type="button" className={habit.frequency === 'weekdays' ? 'selected' : ''} aria-pressed={habit.frequency === 'weekdays'} onClick={() => void change({ frequency: 'weekdays', weekdays: habit.weekdays.length ? habit.weekdays : [1, 2, 3, 4, 5, 6, 0] })}>{t('habits.selectedDays')}</button></div>
      {habit.frequency === 'weekdays' && <div className="habit-weekdays" role="group" aria-label={t('habits.selectedDays')}>{(t('habits.weekdays', { returnObjects: true }) as string[]).map((label, day) => { const weekday = (day + 1) % 7; const selected = habit.weekdays.includes(weekday); return <button key={weekday} type="button" aria-label={label} aria-pressed={selected} className={selected ? 'selected' : ''} onClick={() => { const next = selected ? habit.weekdays.filter((value) => value !== weekday) : [...habit.weekdays, weekday]; if (next.length) void change({ weekdays: next }) }}>{label}</button> })}</div>}
    </div>
    <div className="habit-today-state"><span>{t('habits.today')}</span><button type="button" aria-pressed={completed} onClick={() => void toggleToday()}>{completed ? `✓ ${t('habits.completed')}` : t('habits.markDone')}</button></div>
    <button className="delete-task" onClick={() => void remove()}><Trash2 aria-hidden="true" />{t('habits.delete')}</button>
  </section>
}
