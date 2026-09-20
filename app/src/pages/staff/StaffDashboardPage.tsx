import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAllAnswerLogs } from '../../hooks/useAllAnswerLogs'
import { useAllVocabReviews } from '../../hooks/useAllVocabReviews'
import { useApprovedStudents } from '../../hooks/useApprovedStudents'
import { useCourses } from '../../hooks/useCourses'
import { useVocabCards } from '../../hooks/useVocabCards'
import {
  computeAccuracy,
  computeVocabStats,
  groupLogsByStudent,
} from '../../lib/progressStats'

// staff向けホーム画面。全生徒の学習進捗を一覧できるダッシュボード(SPEC §4.4、Phase 8)。
export function StaffDashboardPage() {
  const { t } = useTranslation()
  const { students } = useApprovedStudents()
  const { courses } = useCourses()
  const { logs } = useAllAnswerLogs()
  const { cards } = useVocabCards()
  const { reviewsByStudent } = useAllVocabReviews()

  const logsByStudent = groupLogsByStudent(logs.filter((log) => !log.isPlacementTest))
  const now = new Date()

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {t('nav.dashboard')}
      </Typography>

      {students.length === 0 ? (
        <Typography color="text.secondary">{t('progress.noStudents')}</Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('progress.studentName')}</TableCell>
                <TableCell>{t('registration.course')}</TableCell>
                <TableCell>{t('staff.level')}</TableCell>
                <TableCell align="right">{t('progress.answeredCountHeader')}</TableCell>
                <TableCell align="right">{t('progress.overallAccuracy')}</TableCell>
                <TableCell align="right">{t('progress.vocabLearned')}</TableCell>
                <TableCell align="right">{t('progress.vocabDueToday')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => {
                const accuracy = computeAccuracy(logsByStudent.get(student.uid) ?? [])
                const courseCards = cards.filter(
                  (card) =>
                    card.courseId === student.courseId && card.level === student.level,
                )
                const vocabStats = computeVocabStats(
                  courseCards,
                  reviewsByStudent.get(student.uid) ?? new Map(),
                  now,
                )
                const courseName =
                  courses.find((c) => c.id === student.courseId)?.name ?? student.courseId

                return (
                  <TableRow key={student.uid}>
                    <TableCell>{student.displayName}</TableCell>
                    <TableCell>{courseName}</TableCell>
                    <TableCell>
                      {student.level ? t(`staff.levels.${student.level}`) : '—'}
                    </TableCell>
                    <TableCell align="right">{accuracy.totalCount}</TableCell>
                    <TableCell align="right">
                      {accuracy.totalCount > 0
                        ? `${Math.round(accuracy.accuracyPercent)}%`
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {vocabStats.learnedCards} / {vocabStats.totalCards}
                    </TableCell>
                    <TableCell align="right">{vocabStats.dueCount}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
