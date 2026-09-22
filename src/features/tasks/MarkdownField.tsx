import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function inlineMarkdown(value: string) {
  const pieces = value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^\)]+\))/g).filter(Boolean)
  return pieces.map((piece, index) => {
    if (piece.startsWith('**') && piece.endsWith('**')) return <strong key={index}>{piece.slice(2, -2)}</strong>
    if (piece.startsWith('*') && piece.endsWith('*')) return <em key={index}>{piece.slice(1, -1)}</em>
    if (piece.startsWith('`') && piece.endsWith('`')) return <code key={index}>{piece.slice(1, -1)}</code>
    const link = piece.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    return <span key={index}>{piece}</span>
  })
}

function MarkdownPreview({ value }: { value: string }) {
  const blocks = value.split('\n')
  return <div className="markdown-preview">{blocks.map((line, index) => {
    if (!line.trim()) return <div className="markdown-spacer" key={index} />
    if (line.startsWith('### ')) return <h4 key={index}>{inlineMarkdown(line.slice(4))}</h4>
    if (line.startsWith('## ')) return <h3 key={index}>{inlineMarkdown(line.slice(3))}</h3>
    if (line.startsWith('# ')) return <h2 key={index}>{inlineMarkdown(line.slice(2))}</h2>
    if (line.startsWith('- ')) return <div className="markdown-list-item" key={index}>• {inlineMarkdown(line.slice(2))}</div>
    return <p key={index}>{inlineMarkdown(line)}</p>
  })}</div>
}

export function MarkdownField({ value, onChange, onBlur }: { value: string; onChange: (value: string) => void; onBlur: () => void }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'edit' | 'preview'>('preview')
  return <div className="markdown-field">
    <div className="field-heading"><h2>{t('taskDetail.description')}</h2><div className="mode-toggle"><button className={mode === 'edit' ? 'selected' : ''} onClick={() => setMode('edit')}>{t('taskDetail.edit')}</button><button className={mode === 'preview' ? 'selected' : ''} onClick={() => setMode('preview')}>{t('taskDetail.preview')}</button></div></div>
    {mode === 'edit' ? <textarea className="description-editor" value={value} onChange={(event: { target: HTMLTextAreaElement }) => onChange(event.target.value)} onBlur={onBlur} placeholder={t('taskDetail.addDescription')} /> : value.trim() ? <MarkdownPreview value={value} /> : <button className="empty-description" onClick={() => setMode('edit')}>{t('taskDetail.addDescription')}</button>}
  </div>
}
