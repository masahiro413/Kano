import MicIcon from '@mui/icons-material/Mic'
import ReplayIcon from '@mui/icons-material/Replay'
import StopIcon from '@mui/icons-material/Stop'
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type RecorderState = 'idle' | 'recording' | 'recorded' | 'error'

// マイク録音UI(SPEC §4.5、Phase 7.1)。録音した音声はブラウザ内で再生確認できる
// のみで、どこにも送信・保存しない。Azure Pronunciation Assessmentとの連携(自動採点)
// は未実装のため、録音した音声を使った採点はまだできない(lib/pronunciationAssessment.ts参照)。
export function PronunciationRecorder() {
  const { t } = useTranslation()
  const [state, setState] = useState<RecorderState>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        setState('recorded')
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch {
      setState('error')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  function reRecord() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setState('idle')
  }

  if (state === 'error') {
    return <Alert severity="error">{t('pronunciation.micError')}</Alert>
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {state !== 'recording' ? (
          <IconButton
            color="primary"
            onClick={startRecording}
            aria-label={t('pronunciation.record')}
          >
            <MicIcon />
          </IconButton>
        ) : (
          <IconButton
            color="error"
            onClick={stopRecording}
            aria-label={t('pronunciation.stop')}
          >
            <StopIcon />
          </IconButton>
        )}
        {state === 'recording' && (
          <Typography color="error" variant="body2">
            {t('pronunciation.recording')}
          </Typography>
        )}
        {state === 'recorded' && (
          <IconButton onClick={reRecord} aria-label={t('pronunciation.reRecord')}>
            <ReplayIcon />
          </IconButton>
        )}
      </Stack>
      {audioUrl && (
        <Box>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
        </Box>
      )}
    </Stack>
  )
}
