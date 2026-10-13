import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Apple, Bed, BicepsFlexed, BookOpenText, Brain, Carrot, ChevronLeft, ChevronRight, Circle, CircleCheck, CircleCheckBig, Coffee, CreditCard, Dumbbell, Footprints, Gamepad2, GlassWater, Heart, Leaf, Mail, Music, NotebookPen, PawPrint, PlantPot, Plus, Popcorn, ShoppingCart, Sparkles, Sun } from 'lucide-react'
import type { Habit, HabitCheck, HabitIcon } from '../../domain/models'
import { LOCAL_CHANGE_EVENT } from '../../sync/signals'
import { habitRepository } from './habitRepository'
import { getCurrentWeekDates, getHabitDayState, getHabitsForManagement, getLocalDateKey } from './habitUtils'

const icons = { 'circle-checked-big': CircleCheckBig, sparkles: Sparkles, sun: Sun, leaf: Leaf, 'plant-pot': PlantPot, 'paw-print': PawPrint, footprints: Footprints, dumbbell: Dumbbell, 'biceps-flexed': BicepsFlexed, heart: Heart, brain: Brain, bed: Bed, 'glass-water': GlassWater, coffee: Coffee, apple: Apple, carrot: Carrot, popcorn: Popcorn, 'shopping-cart': ShoppingCart, 'book-open-text': BookOpenText, gamepad2: Gamepad2, music: Music, mail: Mail, 'notebook-pen': NotebookPen, 'credit-card': CreditCard } satisfies Record<HabitIcon, typeof Circle>

export function HabitsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [habits, setHabits] = useState<Habit[]>([])
  const [checks, setChecks] = useState<HabitCheck[]>([])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const week = getCurrentWeekDates()
  const start = getLocalDateKey(week[0])
  const end = getLocalDateKey(week[6])
  const refresh = useCallback(async () => {
    const [all, weeklyChecks] = await Promise.all([habitRepository.list(), habitRepository.checksBetweenDates(start, end)])
    setHabits(getHabitsForManagement(all))
    setChecks(weeklyChecks)
  }, [start, end])
  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener(LOCAL_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(LOCAL_CHANGE_EVENT, onChange)
  }, [refresh])
  const submit = async () => {
    if (!name.trim()) return
    const habit = await habitRepository.create(name)
    setName('')
    setAdding(false)
    navigate(`/habits/${habit.id}`)
  }
  const today = getLocalDateKey()
  const days = t('habits.weekdays', { returnObjects: true }) as string[]
  return <section className="habits-page">
    <header className="habits-page-heading">
      <button type="button" className="back-link" onClick={() => navigate('/tasks')}><ChevronLeft aria-hidden="true" />{t('habits.backToTasks')}</button>
      <h1>{t('habits.title')}</h1>
      <button type="button" className="add-button" aria-label={t('habits.add')} onClick={() => setAdding(!adding)}><Plus aria-hidden="true" /></button>
    </header>
    {adding && <form className="habit-create-form" onSubmit={(event: { preventDefault: () => void }) => { event.preventDefault(); void submit() }}><input autoFocus className="quick-add" value={name} onChange={(event: { target: HTMLInputElement }) => setName(event.target.value)} placeholder={t('habits.quickAdd')} aria-label={t('habits.name')} /><button type="submit" disabled={!name.trim()}>{t('habits.create')}</button></form>}
    {!habits.length ? <p className="habits-empty">{t('habits.empty')}</p> : <>
      <section className="habit-week-section" aria-labelledby="habit-week-title">
        <h2 id="habit-week-title">{t('habits.thisWeek')}</h2>
        <div className="habit-week-grid" role="table" aria-label={t('habits.thisWeek')}>
          <div className="habit-week-header" role="row"><span role="columnheader" className="habit-week-name-spacer" />{week.map((date, index) => <span role="columnheader" key={getLocalDateKey(date)} className={getLocalDateKey(date) === today ? 'is-today' : ''}>{days[index]}</span>)}</div>
          {habits.map((habit) => { const Icon = icons[habit.icon] ?? CircleCheckBig; return <div className="habit-week-row" role="row" key={habit.id}>
            <span className={`habit-week-name habit-tint-${habit.color}`} role="rowheader" title={habit.name}><Icon aria-hidden="true" /><span>{habit.name}</span></span>
            {week.map((date) => {
              const key = getLocalDateKey(date)
              const state = getHabitDayState(habit, checks, date)
              const StateIcon = state === 'completed' ? CircleCheck : state === 'missed' ? Circle : null
              const dayName = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][(date.getDay() + 6) % 7]
              return <span key={key} role="cell" className={`habit-week-cell state-${state} ${key === today ? 'is-today' : ''}`} aria-label={t(`habits.states.${state}`, { name: habit.name, day: t(`habits.dayNames.${dayName}`) })} title={t(`habits.states.${state}`, { name: habit.name, day: t(`habits.dayNames.${dayName}`) })}>{StateIcon ? <StateIcon aria-hidden="true" /> : state === 'not-scheduled' ? <span aria-hidden="true">·</span> : <span aria-hidden="true" />}</span>
            })}
          </div> })}
        </div>
      </section>
      <section className="habit-management" aria-labelledby="habit-list-title">
        <h2 id="habit-list-title">{t('habits.yourHabits')}</h2>
        <div className="habit-management-list">{habits.map((habit) => { const Icon = icons[habit.icon] ?? CircleCheckBig; return <Link className="habit-management-row" to={`/habits/${habit.id}`} key={habit.id}><span className={`habit-management-icon habit-tint-${habit.color}`}><Icon aria-hidden="true" /></span><span>{habit.name}</span><ChevronRight aria-hidden="true" /></Link> })}</div>
      </section>
    </>}
  </section>
}
