import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { useQuestionSets } from '../../hooks/useQuestionSets'
import type { StudentProfile } from '../../types/firestore'

// 学習機能(問題集・単語帳・リスニング・発音)のトップ画面。
// タスク管理とはデータ・機能ともに独立したセクション(SPEC §0)。
// 現時点では問題演習(Phase 5)のみ実装済み。単語帳(Phase 6)・発音練習(Phase 7)は
// 別途実装する。
export function LearningHomePage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const student = profile as StudentProfile

  const { questionSets, loading } = useQuestionSets()
  // 問題集・単語帳・リスニング教材は「コース×レベル」の組み合わせで公開範囲が決まる
  // (SPEC §4.2)。プレースメントテスト用の問題集はここには表示しない。
  const availableSets = questionSets.filter(
    (set) =>
      !set.isPlacementTest &&
      set.courseId === student?.courseId &&
      set.level === student?.level,
  )

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {t('nav.learning')}
      </Typography>

      {!loading && availableSets.length === 0 && (
        <Typography color="text.secondary">{t('learning.empty')}</Typography>
      )}

      <Stack spacing={2}>
        {availableSets.map((set) => (
          <Card key={set.id}>
            <CardActionArea component={RouterLink} to={`/learning/questions/${set.id}`}>
              <CardContent>
                <Typography variant="h6">{set.title}</Typography>
                {set.description && (
                  <Typography color="text.secondary">{set.description}</Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
