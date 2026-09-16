import { useTranslation } from 'react-i18next'

// 承認待ちの生徒に表示する専用画面。ログインはできるがこの画面以外へは遷移させない(SPEC §2.2)。
export function PendingApprovalPage() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('pendingApproval.title')}</h1>
      <p>{t('pendingApproval.message')}</p>
    </main>
  )
}
