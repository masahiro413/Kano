import {
  Box,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { QuestionAnswer } from '../lib/questionScoring'
import type { Question } from '../types/firestore'
import { PronunciationRecorder } from './PronunciationRecorder'

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

interface QuestionAnswerInputProps {
  question: Question
  answer: QuestionAnswer | undefined
  onChange: (answer: QuestionAnswer) => void
}

// SPEC §4.1で列挙された各出題形式の解答入力UI。プレースメントテスト(Phase 4)と
// 通常の問題演習(Phase 5)の両方から再利用する想定。発音・ロールプレイ形式は
// 自動採点が未実装のため、解答不要である旨を表示するのみ(SPEC §4.5、Phase 7で対応)。
export function QuestionAnswerInput({
  question,
  answer,
  onChange,
}: QuestionAnswerInputProps) {
  const { t } = useTranslation()

  // 並び替え問題の表示順はランダムだが、同じ問題を再描画しても崩れないよう
  // 問題IDごとに1回だけシャッフルする。
  const shuffledPieces = useMemo(() => {
    if (question.format !== 'reorder') return []
    return shuffle(question.pieces)
  }, [question])

  switch (question.format) {
    case 'choice':
      return (
        <RadioGroup
          value={answer?.format === 'choice' ? answer.selectedIndex : ''}
          onChange={(e) =>
            onChange({ format: 'choice', selectedIndex: Number(e.target.value) })
          }
        >
          {question.choices.map((choice, index) => (
            <FormControlLabel
              key={index}
              value={index}
              control={<Radio />}
              label={choice}
            />
          ))}
        </RadioGroup>
      )

    case 'free_text':
      return (
        <TextField
          value={answer?.format === 'free_text' ? answer.text : ''}
          onChange={(e) => onChange({ format: 'free_text', text: e.target.value })}
          fullWidth
        />
      )

    case 'reorder': {
      const selectedOrder = answer?.format === 'reorder' ? answer.order : []
      return (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {t('questionAnswer.reorderInstruction')}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {shuffledPieces.map((piece, index) => {
              const usedCount = selectedOrder.filter((p) => p === piece).length
              const totalCount = shuffledPieces.filter((p) => p === piece).length
              const isFullyUsed = usedCount >= totalCount
              return (
                <Chip
                  key={index}
                  label={piece}
                  disabled={isFullyUsed}
                  onClick={() =>
                    onChange({ format: 'reorder', order: [...selectedOrder, piece] })
                  }
                />
              )
            })}
          </Stack>
          <Typography variant="body2">
            {t('questionAnswer.yourOrder')}: {selectedOrder.join(' ') || '—'}
          </Typography>
          {selectedOrder.length > 0 && (
            <Chip
              label={t('questionAnswer.reset')}
              variant="outlined"
              onClick={() => onChange({ format: 'reorder', order: [] })}
            />
          )}
        </Stack>
      )
    }

    case 'error_identification':
      return (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {question.segments.map((segment, index) => (
            <Chip
              key={index}
              label={segment}
              color={
                answer?.format === 'error_identification' &&
                answer.selectedSegmentIndex === index
                  ? 'primary'
                  : 'default'
              }
              onClick={() =>
                onChange({ format: 'error_identification', selectedSegmentIndex: index })
              }
            />
          ))}
        </Stack>
      )

    case 'pronunciation':
      return (
        <Stack spacing={1}>
          <Typography variant="subtitle2">{question.targetText}</Typography>
          <PronunciationRecorder />
          <Typography color="text.secondary" variant="body2">
            {t('questionAnswer.pronunciationScoringNotYetSupported')}
          </Typography>
        </Stack>
      )

    case 'roleplay':
      return (
        <Box>
          <Typography color="text.secondary">
            {t('questionAnswer.voiceNotYetSupported')}
          </Typography>
        </Box>
      )
  }
}
