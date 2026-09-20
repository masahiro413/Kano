import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/authContext'
import { useAnswerLogs } from '../../hooks/useAnswerLogs'
import { useLevelChanges } from '../../hooks/useLevelChanges'
import { useVocabCards } from '../../hooks/useVocabCards'
import { useVocabReviews } from '../../hooks/useVocabReviews'
import {
  computeAccuracy,
  computeVocabStats,
  formatDate,
  groupAccuracyByFormat,
} from '../../lib/progressStats'
import type { StudentProfile } from '../../types/firestore'

// 生徒本人向けホーム画面。自分の学習履歴・スコア推移を表示する(SPEC §4.4、Phase 8)。
export function StudentDashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const student = profile as StudentProfile

  const { logs } = useAnswerLogs(student?.uid)
  const { levelChanges } = useLevelChanges(student?.uid)
  const { cards } = useVocabCards()
  const { reviews } = useVocabReviews(student?.uid)

  const practiceLogs = logs.filter((log) => !log.isPlacementTest)
  const overall = computeAccuracy(practiceLogs)
  const byFormat = groupAccuracyByFormat(practiceLogs)
  const recent = practiceLogs.slice(0, 10)

  const courseCards = cards.filter(
    (card) => card.courseId === student?.courseId && card.level === student?.level,
  )
  const vocabStats = computeVocabStats(courseCards, reviews, new Date())

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {t('nav.dashboard')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {t('progress.overallAccuracy')}
              </Typography>
              <Typography variant="h4">{Math.round(overall.accuracyPercent)}%</Typography>
              <Typography color="text.secondary" variant="body2">
                {t('progress.answeredCount', { count: overall.totalCount })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {t('progress.vocabLearned')}
              </Typography>
              <Typography variant="h4">
                {vocabStats.learnedCards} / {vocabStats.totalCards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                {t('progress.vocabDueToday')}
              </Typography>
              <Typography variant="h4">{vocabStats.dueCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {recent.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('progress.recentAnswers')}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {recent.map((log) => (
              <Chip
                key={log.id}
                size="small"
                label={log.correct ? '○' : '×'}
                color={log.correct ? 'success' : 'error'}
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      )}

      {byFormat.size > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('progress.accuracyByFormat')}
          </Typography>
          <List dense>
            {Array.from(byFormat.entries()).map(([format, stats]) => (
              <ListItem key={format}>
                <ListItemText
                  primary={t(`staff.questions.formats.${format}`)}
                  secondary={t('progress.formatStats', {
                    percent: Math.round(stats.accuracyPercent),
                    correct: stats.correctCount,
                    total: stats.totalCount,
                  })}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {levelChanges.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('progress.levelHistory')}
          </Typography>
          <List dense>
            {levelChanges.map((change) => (
              <ListItem key={change.id}>
                <ListItemText
                  primary={
                    change.fromLevel
                      ? `${t(`staff.levels.${change.fromLevel}`)} → ${t(`staff.levels.${change.toLevel}`)}`
                      : t(`staff.levels.${change.toLevel}`)
                  }
                  secondary={formatDate(change.createdAt)}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  )
}
