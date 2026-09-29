import { useTranslation } from 'react-i18next'
import type { Birthday } from '../../domain/models'
import { formatBirthdayDate, getBirthdayProximity, getDaysUntilBirthday } from './birthdayUtils'

export function BirthdayRow({ birthday, onClick }: { key?: string; birthday: Birthday; onClick?: () => void }) {
  const { t, i18n } = useTranslation()
  const days = getDaysUntilBirthday(birthday)
  const label = days === 0 ? t('birthdays.today') : days === 1 ? t('birthdays.tomorrow') : t('birthdays.days', { count: days })
  return <button className={`birthday-row birthday-${getBirthdayProximity(days)}`} onClick={onClick}>
    <span className="birthday-date">{formatBirthdayDate(birthday, i18n.language)}</span><span className="birthday-name" translate="no">{birthday.name}</span><span className="birthday-proximity">{label}</span>
  </button>
}
