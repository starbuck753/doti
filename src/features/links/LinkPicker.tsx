import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import type { TaskBucket } from '../../domain/models'

export function LinkPicker({ title, searchPlaceholder, items, emptyLabel, createLabel, onSelect, onCreate, onClose }: { title: string; searchPlaceholder: string; items: { id: string; title: string }[]; emptyLabel: string; createLabel: string; onSelect: (id: string) => void; onCreate: () => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const filtered = items.filter((item) => item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <div className="link-picker"><div className="link-picker-header"><strong>{title}</strong><button onClick={onClose}>×</button></div><div className="link-picker-search-wrap"><Search className="link-picker-search-icon" aria-hidden="true" /><input autoFocus className="link-picker-search" value={query} onChange={(event: { target: HTMLInputElement }) => setQuery(event.target.value)} placeholder={searchPlaceholder} /></div>
    <div className="link-picker-items">{filtered.map((item) => <button key={item.id} onClick={() => onSelect(item.id)}>{item.title}</button>)}{!filtered.length && <span className="link-picker-empty">{emptyLabel}</span>}</div><button className="link-picker-create" onClick={onCreate}>+ {createLabel}</button>
  </div>
}

export function QuickTaskCreator({ onCreate, onCancel }: { onCreate: (title: string, bucket: TaskBucket) => void; onCancel: () => void }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [bucket, setBucket] = useState<TaskBucket>('today')
  return <div className="quick-task-creator"><label>{t('links.taskTitle')}<input autoFocus value={title} onChange={(event: { target: HTMLInputElement }) => setTitle(event.target.value)} /></label><div className="segmented-control"><button className={bucket === 'today' ? 'selected' : ''} onClick={() => setBucket('today')}>{t('tasks.today')}</button><button className={bucket === 'later' ? 'selected' : ''} onClick={() => setBucket('later')}>{t('tasks.later')}</button></div><div className="quick-task-actions"><button className="primary-action" disabled={!title.trim()} onClick={() => onCreate(title.trim(), bucket)}>{t('links.create')}</button><button className="secondary-action" onClick={onCancel}>{t('links.cancel')}</button></div></div>
}
