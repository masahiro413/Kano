import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Rating, type Grade } from 'ts-fsrs'
import { useAuth } from '../../contexts/authContext'
import { useVocabCards } from '../../hooks/useVocabCards'
import { useVocabReviews } from '../../hooks/useVocabReviews'
import { isDue } from '../../lib/srs'
import { recordVocabReview } from '../../lib/vocabReviews'
import type { StudentProfile, VocabCard, VocabReview } from '../../types/firestore'

// 単語帳の学習画面(SRS、SPEC §4.1)。生徒のコース×レベルに一致するカードのうち、
// 未学習または復習予定日を過ぎたものを1枚ずつ出題する。表(用語)→裏(意味・例文)の
// カード形式で、評価(もう一度/難しい/普通/簡単)に応じてts-fsrsが次回復習日を決める。
export function VocabPracticePage() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const student = profile as StudentProfile

  const { cards, loading: loadingCards } = useVocabCards()
  const { reviews, loading: loadingReviews } = useVocabReviews(student?.uid)

  if (loadingCards || loadingReviews || !student) {
    return <Typography color="text.secondary">{t('common.loading')}</Typography>
  }

  const now = new Date()
  const dueCards = cards.filter(
    (card) =>
      card.courseId === student.courseId &&
      card.level === student.level &&
      isDue(reviews.get(card.id) ?? null, now),
  )

  return (
    <VocabPracticeSession
      studentUid={student.uid}
      initialQueue={dueCards}
      reviews={reviews}
    />
  )
}

interface VocabPracticeSessionProps {
  studentUid: string
  initialQueue: VocabCard[]
  reviews: Map<string, VocabReview>
}

// 出題キューはセッション開始時に1回だけ確定させる(useState(initialQueue))。
// 復習を記録するとFirestoreの購読データ(reviews)がリアルタイム更新されるが、
// それによってキューが再計算されて出題中のカードが入れ替わらないようにするため。
function VocabPracticeSession({
  studentUid,
  initialQueue,
  reviews,
}: VocabPracticeSessionProps) {
  const { t } = useTranslation()
  const [queue, setQueue] = useState<VocabCard[]>(initialQueue)
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const currentCard = queue[0]

  async function handleRate(grade: Grade) {
    if (!currentCard || submitting) return
    setSubmitting(true)
    try {
      await recordVocabReview(
        studentUid,
        currentCard.id,
        reviews.get(currentCard.id) ?? null,
        grade,
      )
      setQueue((prev) => prev.slice(1))
      setReviewedCount((count) => count + 1)
      setRevealed(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentCard) {
    return (
      <Box sx={{ maxWidth: 480 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('vocabPractice.title')}
        </Typography>
        {reviewedCount > 0 ? (
          <Alert severity="success">
            {t('vocabPractice.sessionComplete', { count: reviewedCount })}
          </Alert>
        ) : (
          <Typography color="text.secondary">{t('vocabPractice.empty')}</Typography>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('vocabPractice.title')}
      </Typography>
      <Typography color="text.secondary">
        {t('vocabPractice.remaining', { count: queue.length })}
      </Typography>

      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', my: 2 }}>
        <Typography variant="h5">{currentCard.term}</Typography>
        {revealed && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" color="text.secondary">
              {currentCard.meaning}
            </Typography>
            {currentCard.exampleSentence && (
              <Typography sx={{ mt: 1 }}>{currentCard.exampleSentence}</Typography>
            )}
          </Box>
        )}
      </Paper>

      {!revealed ? (
        <Button variant="contained" fullWidth onClick={() => setRevealed(true)}>
          {t('vocabPractice.reveal')}
        </Button>
      ) : (
        <Stack direction="row" spacing={1}>
          <Button
            color="error"
            variant="outlined"
            fullWidth
            disabled={submitting}
            onClick={() => handleRate(Rating.Again)}
          >
            {t('vocabPractice.again')}
          </Button>
          <Button
            color="warning"
            variant="outlined"
            fullWidth
            disabled={submitting}
            onClick={() => handleRate(Rating.Hard)}
          >
            {t('vocabPractice.hard')}
          </Button>
          <Button
            color="success"
            variant="outlined"
            fullWidth
            disabled={submitting}
            onClick={() => handleRate(Rating.Good)}
          >
            {t('vocabPractice.good')}
          </Button>
          <Button
            color="success"
            variant="contained"
            fullWidth
            disabled={submitting}
            onClick={() => handleRate(Rating.Easy)}
          >
            {t('vocabPractice.easy')}
          </Button>
        </Stack>
      )}
    </Box>
  )
}
