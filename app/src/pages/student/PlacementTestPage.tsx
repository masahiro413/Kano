import { Alert, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { QuestionAnswerInput } from '../../components/QuestionAnswerInput'
import { useAuth } from '../../contexts/authContext'
import { useQuestionSets } from '../../hooks/useQuestionSets'
import { useQuestions } from '../../hooks/useQuestions'
import { submitPlacementTest, type PlacementTestResult } from '../../lib/placementTest'
import { isScorable, type QuestionAnswer } from '../../lib/questionScoring'
import type { StudentProfile } from '../../types/firestore'

// 承認後に受験するプレースメントテスト。選択式・文法・リスニング・発音を含む
// 総合テストで初期レベルを判定する(SPEC §4.2.2)。
// 承認済み・未受験の生徒はRequirePlacementTestガードによりここへ誘導される。
// 発音・ロールプレイ形式の問題はAzure連携が未実装のため採点対象外とする(SPEC §8参照)。
export function PlacementTestPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const student = profile as StudentProfile

  const { questionSets, loading: loadingSets } = useQuestionSets()
  const placementSet = useMemo(
    () =>
      questionSets.find(
        (set) => set.isPlacementTest && set.courseId === student?.courseId,
      ),
    [questionSets, student?.courseId],
  )
  const { questions, loading: loadingQuestions } = useQuestions(placementSet?.id ?? '')

  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PlacementTestResult | null>(null)

  function setAnswer(questionId: string, answer: QuestionAnswer) {
    setAnswers((prev) => new Map(prev).set(questionId, answer))
  }

  async function handleSubmit() {
    if (!student || !placementSet) return
    setSubmitting(true)
    try {
      const res = await submitPlacementTest(
        student.uid,
        placementSet.id,
        questions,
        answers,
      )
      setResult(res)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <Box sx={{ maxWidth: 480 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('placementTest.resultTitle')}
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('placementTest.resultLevel', { level: t(`staff.levels.${result.level}`) })}
        </Alert>
        <Button variant="contained" component={RouterLink} to="/learning">
          {t('placementTest.goToLearning')}
        </Button>
      </Box>
    )
  }

  if (loadingSets || loadingQuestions) {
    return <Typography color="text.secondary">{t('common.loading')}</Typography>
  }

  if (!placementSet) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('placementTest.title')}
        </Typography>
        <Typography color="text.secondary">{t('placementTest.notReady')}</Typography>
      </Box>
    )
  }

  const scorableCount = questions.filter(isScorable).length
  const answeredScorableCount = questions.filter(
    (q) => isScorable(q) && answers.has(q.id),
  ).length

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('placementTest.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('placementTest.instruction')}
      </Typography>

      <Stack spacing={3}>
        {questions.map((question, index) => (
          <Paper key={question.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {index + 1}. {question.promptText}
            </Typography>
            <QuestionAnswerInput
              question={question}
              answer={answers.get(question.id)}
              onChange={(answer) => setAnswer(question.id, answer)}
            />
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography color="text.secondary">
          {t('placementTest.answeredCount', {
            answered: answeredScorableCount,
            total: scorableCount,
          })}
        </Typography>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {t('placementTest.submit')}
        </Button>
      </Stack>
    </Box>
  )
}
