import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

// 承認後に受験するプレースメントテスト。選択式・文法・リスニング・発音を含む
// 20〜30問の総合テストで初期レベルを判定する(SPEC §4.2.2)。
// 承認済み・未受験の生徒はRequirePlacementTestガードによりここへ誘導される。
export function PlacementTestPage() {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('placementTest.title')}
      </Typography>
      <Typography color="text.secondary">{t('placementTest.comingSoon')}</Typography>
      {/* TODO: テスト受験フロー本体(Phase 4) */}
    </Box>
  )
}
