import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLevelSettings } from '../../hooks/useLevelSettings'
import { updateLevelSettings } from '../../lib/levelSettings'
import type { LevelThresholdSettings } from '../../types/firestore'

const FIELDS: { key: keyof LevelThresholdSettings; labelKey: string; max: number }[] = [
  {
    key: 'placementAdvancedMin',
    labelKey: 'staff.levelSettings.placementAdvancedMin',
    max: 100,
  },
  {
    key: 'placementIntermediateMin',
    labelKey: 'staff.levelSettings.placementIntermediateMin',
    max: 100,
  },
  {
    key: 'promotionThreshold',
    labelKey: 'staff.levelSettings.promotionThreshold',
    max: 100,
  },
  {
    key: 'demotionThreshold',
    labelKey: 'staff.levelSettings.demotionThreshold',
    max: 100,
  },
  {
    key: 'recentQuestionCount',
    labelKey: 'staff.levelSettings.recentQuestionCount',
    max: 500,
  },
]

// レベル判定に使う閾値の調整画面(SPEC §4.2.1, §4.2.2)。
// プレースメントテストの固定閾値判定と、通常演習での自動昇降級(ヒステリシス)の
// 両方の設定値をここで一元管理する。
export function LevelSettingsPage() {
  const { t } = useTranslation()
  const { settings, loading } = useLevelSettings()

  if (loading) {
    return <Typography color="text.secondary">{t('common.loading')}</Typography>
  }

  return <LevelSettingsForm initialSettings={settings} />
}

// 読み込み完了後に一度だけマウントされるフォーム本体。useState(initialSettings)で
// 初期値を取り込むことで、読み込み完了時のstate同期をuseEffectなしで行う。
function LevelSettingsForm({
  initialSettings,
}: {
  initialSettings: LevelThresholdSettings
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<LevelThresholdSettings>(initialSettings)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSaved(false)
    try {
      await updateLevelSettings(form)
      setSaved(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {t('staff.levelSettings.title')}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {saved && <Alert severity="success">{t('staff.levelSettings.saved')}</Alert>}
          {FIELDS.map((field) => (
            <TextField
              key={field.key}
              type="number"
              label={t(field.labelKey)}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
              fullWidth
              slotProps={{ htmlInput: { min: 0, max: field.max } }}
            />
          ))}
          <Button type="submit" variant="contained" disabled={submitting}>
            {t('common.save')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
