import { useTranslation } from 'react-i18next'

// 問題集・単語帳・リスニング教材の作成/編集画面(SPEC §4.3)。
export function ContentManagementPage() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('nav.content')}</h1>
      {/* TODO: コンテンツ管理CMS(Phase 3) */}
    </main>
  )
}
