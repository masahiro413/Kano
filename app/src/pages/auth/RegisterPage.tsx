import { useTranslation } from 'react-i18next'

// 生徒のセルフサインアップ画面。SPEC §2.2の入力項目(氏名・メール・パスワード・
// 連絡先・受講コース・表示言語)に対応するフォームをPhase 1で実装する。
export function RegisterPage() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('auth.register')}</h1>
      {/* TODO: 登録フォーム(Phase 1) */}
    </main>
  )
}
