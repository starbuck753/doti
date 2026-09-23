import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { Birthday } from '../../domain/models'
import { BirthdayRow } from './BirthdayRow'
import { useBirthdays } from './useBirthdays'

function daysInMonth(month: number) { return month === 2 ? 29 : [4, 6, 9, 11].includes(month) ? 30 : 31 }

function BirthdayForm({ birthday, onSave, onDelete, onCancel }: { birthday?: Birthday; onSave: (name: string, month: number, day: number) => Promise<void>; onDelete?: () => Promise<void>; onCancel: () => void }) {
  const { t, i18n } = useTranslation()
  const [name, setName] = useState(birthday?.name ?? '')
  const [month, setMonth] = useState(birthday?.month ?? new Date().getMonth() + 1)
  const [day, setDay] = useState(birthday?.day ?? 1)
  const [error, setError] = useState('')
  useEffect(() => { setName(birthday?.name ?? ''); setMonth(birthday?.month ?? new Date().getMonth() + 1); setDay(birthday?.day ?? 1); setError('') }, [birthday])
  const monthName = (value: number) => new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date(2024, value - 1, 1))
  const submit = async () => {
    if (!name.trim()) return setError(t('birthdays.nameRequired'))
    if (day < 1 || day > daysInMonth(month)) return setError(t('birthdays.invalidDay'))
    await onSave(name.trim(), month, day)
  }
  return <div className="birthday-form" aria-label={birthday ? t('birthdays.editTitle') : t('birthdays.addTitle')}>
    <label>{t('birthdays.name')}<input autoFocus value={name} onChange={(event: { target: HTMLInputElement }) => setName(event.target.value)} /></label>
    <div className="birthday-form-date"><label>{t('birthdays.month')}<select value={month} onChange={(event: { target: HTMLSelectElement }) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{monthName(value)}</option>)}</select></label><label>{t('birthdays.day')}<input type="number" min="1" max={daysInMonth(month)} value={day} onChange={(event: { target: HTMLInputElement }) => setDay(Number(event.target.value))} /></label></div>
    {error && <p className="form-error">{error}</p>}
    <div className="birthday-form-actions"><button className="primary-action" onClick={() => void submit()}>{birthday ? t('birthdays.save') : t('birthdays.add')}</button><button className="secondary-action" onClick={onCancel}>{t('birthdays.cancel')}</button>{onDelete && <button className="delete-birthday" onClick={() => void onDelete()}>{t('birthdays.delete')}</button>}</div>
  </div>
}

export function BirthdaysPage() {
  const { t } = useTranslation()
  const { birthdays, addBirthday, updateBirthday, deleteBirthday } = useBirthdays()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Birthday | undefined>(undefined)
  const openCreate = () => { setEditing(undefined); setFormOpen(true) }
  const closeForm = () => { setEditing(undefined); setFormOpen(false) }
  const save = async (name: string, month: number, day: number) => { if (editing) await updateBirthday(editing, name, month, day); else await addBirthday(name, month, day); closeForm() }
  const remove = async () => { if (editing && window.confirm(t('birthdays.confirmDelete'))) { await deleteBirthday(editing); closeForm() } }
  return <section className="birthdays-page"><div className="birthdays-heading"><div><p className="eyebrow">Doti</p><h1>{t('navigation.birthdays')}</h1></div><button className="add-button" aria-label={t('birthdays.addTitle')} onClick={openCreate}><Plus aria-hidden="true" /></button></div>
    {formOpen && <BirthdayForm birthday={editing} onSave={save} onDelete={editing ? remove : undefined} onCancel={closeForm} />}
    <div className="section-heading birthdays-list-heading"><h2>{t('tasks.upcomingBirthdays')}</h2></div>
    <div className="birthday-list">{birthdays.map((birthday) => <BirthdayRow key={birthday.id} birthday={birthday} onClick={() => { setEditing(birthday); setFormOpen(true) }} />)}</div>
    {!birthdays.length && !formOpen && <button className="empty-birthdays" onClick={openCreate}>{t('birthdays.empty')}</button>}
  </section>
}

export function UpcomingBirthdays() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { birthdays } = useBirthdays()
  return <section className="upcoming-birthdays"><div className="upcoming-heading"><h2>{t('tasks.upcomingBirthdays')}</h2><button onClick={() => navigate('/birthdays')}>{t('birthdays.seeAll')}</button></div>{birthdays.length ? birthdays.slice(0, 3).map((birthday) => <BirthdayRow key={birthday.id} birthday={birthday} onClick={() => navigate('/birthdays')} />) : <button className="empty-birthdays dashboard-empty" onClick={() => navigate('/birthdays')}>{t('birthdays.empty')}</button>}</section>
}
