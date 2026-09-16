import { useTranslation } from 'react-i18next'

// タスク管理画面。生徒・staffいずれのロールでも使う共通ページで、
// データは所有ユーザー(uid)ごとに完全に独立している(SPEC §3)。
export function TasksPage() {
  const { t } = useTranslation()

  return (
    <main>
      <h1>{t('tasks.title')}</h1>
      {/* TODO: タスク一覧・追加・完了・削除(Phase 2) */}
    </main>
  )
}
