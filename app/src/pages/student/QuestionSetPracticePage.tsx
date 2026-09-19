import { Alert, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { QuestionAnswerInput } from '../../components/QuestionAnswerInput'
import { QuestionContext } from '../../components/QuestionContext'
import { useAuth } from '../../contexts/authContext'
import { useQuestionSets } from '../../hooks/useQuestionSets'
import { useQuestions } from '../../hooks/useQuestions'
import {
  submitQuestionPractice,
  type QuestionPracticeResult,
} from '../../lib/questionPractice'
import { isScorable, type QuestionAnswer } from '../../lib/questionScoring'
import type { StudentProfile } from '../../types/firestore'

// 通常の問題演習の受験フロー(SPEC §4.1)。LearningHomePageから、生徒の
// コース×レベルに合った問題集を選んで遷移してくる。発音・ロールプレイ形式は
// Azure連携が未実装のため採点対象外とする(プレースメントテストと同様、SPEC §8参照)。
export function QuestionSetPracticePage() {
  const { t } = useTranslation()
  const { setId } = useParams<{ setId: string }>()
  const { profile } = useAuth()
  const student = profile as StudentProfile

  const { questionSets } = useQuestionSets()
  const questionSet = questionSets.find((set) => set.id === setId)
  const { questions, loading: loadingQuestions } = useQuestions(setId ?? '')

  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuestionPracticeResult | null>(null)

  function setAnswer(questionId: string, answer: QuestionAnswer) {
    setAnswers((prev) => new Map(prev).set(questionId, answer))
  }

  async function handleSubmit() {
    if (!student?.level || !setId) return
    setSubmitting(true)
    try {
      const res = await submitQuestionPractice(
        student.uid,
        setId,
        questions,
        answers,
        student.level,
      )
      setResult(res)
    } finally {
      setSubmitting(false)
    }
  }

  if (!setId) return null

  if (result) {
    return (
      <Box sx={{ maxWidth: 480 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('questionPractice.resultTitle')}
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('questionPractice.resultScore', {
            correct: result.correctCount,
            total: result.scorableCount,
          })}
        </Alert>
        {result.levelChange && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('questionPractice.levelChanged', {
              level: t(`staff.levels.${result.levelChange}`),
            })}
          </Alert>
        )}
        <Button variant="contained" component={RouterLink} to="/learning">
          {t('questionPractice.backToLearning')}
        </Button>
      </Box>
    )
  }

  if (loadingQuestions) {
    return <Typography color="text.secondary">{t('common.loading')}</Typography>
  }

  const scorableCount = questions.filter(isScorable).length
  const answeredScorableCount = questions.filter(
    (q) => isScorable(q) && answers.has(q.id),
  ).length

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {questionSet?.title ?? ''}
      </Typography>

      <Stack spacing={3}>
        {questions.map((question, index) => (
          <Paper key={question.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {index + 1}. {question.promptText}
            </Typography>
            <QuestionContext question={question} />
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
          {t('questionPractice.answeredCount', {
            answered: answeredScorableCount,
            total: scorableCount,
          })}
        </Typography>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {t('questionPractice.submit')}
        </Button>
      </Stack>
    </Box>
  )
}
