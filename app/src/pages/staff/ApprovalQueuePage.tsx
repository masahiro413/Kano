import { useTranslation } from 'react-i18next'

// 承認待ちの生徒一覧。staffなら誰でもボタン一つで承認/拒否できる(SPEC §2.2)。
export function ApprovalQueuePage() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('nav.approvals')}</h1>
      {/* TODO: 承認待ち一覧 + 承認/拒否ボタン(Phase 1) */}
    </main>
  )
}
