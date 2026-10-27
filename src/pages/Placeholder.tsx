import { useTranslation } from 'react-i18next'

export default function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-bold">{t(title)}</h1>
      <p className="mt-2 text-slate-500">{t('common.comingSoon')}</p>
    </div>
  )
}
