import { Box, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useListeningMaterials } from '../hooks/useListeningMaterials'
import { getListeningMaterialUrl } from '../lib/listeningMaterials'
import type { Question } from '../types/firestore'

interface QuestionContextProps {
  question: Question
}

// 問題本文の前に表示する付随情報: リスニング教材の音声再生(SPEC §4.1)と、
// 会話文問題の文脈となる対話(SPEC §4.1.2)。出題形式を問わず共通で使う。
export function QuestionContext({ question }: QuestionContextProps) {
  const { t } = useTranslation()
  const { materials } = useListeningMaterials()
  const material = materials.find((m) => m.id === question.listeningMaterialId)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!material) return
    let cancelled = false
    getListeningMaterialUrl(material.audioAssetPath).then((url) => {
      if (!cancelled) setAudioUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [material])

  if (!material && !question.dialogueTurns?.length) return null

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {material && (
        <Box>
          {audioUrl ? (
            <audio controls src={audioUrl} style={{ width: '100%' }} />
          ) : (
            <Typography color="text.secondary" variant="body2">
              {t('common.loading')}
            </Typography>
          )}
        </Box>
      )}
      {!!question.dialogueTurns?.length && (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
          <Stack spacing={0.5}>
            {question.dialogueTurns.map((turn, index) => (
              <Typography key={index} variant="body2">
                <strong>{turn.speaker}:</strong> {turn.text}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
