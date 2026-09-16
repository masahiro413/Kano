import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { createStaffAccount } from '../../lib/firebaseAuth'
import type { DisplayLanguage } from '../../types/firestore'

// 既存staffが新規staffアカウントを作成する画面(SPEC §2.3)。
// メール+仮パスワードを発行し、staffが本人に別途伝える運用。
export function CreateStaffAccountPage() {
  const { t } = useTranslation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('ja')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)
    try {
      await createStaffAccount({ email, temporaryPassword, displayName, displayLanguage })
      setSuccess(true)
      setDisplayName('')
      setEmail('')
      setTemporaryPassword('')
    } catch {
      setError(t('staff.createAccount.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('staff.createAccount.title')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success">{t('staff.createAccount.success')}</Alert>
          )}
          <TextField
            label={t('registration.fullName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t('staff.createAccount.temporaryPassword')}
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            required
            fullWidth
          />
          <TextField
            select
            label={t('registration.displayLanguage')}
            value={displayLanguage}
            onChange={(e) => setDisplayLanguage(e.target.value as DisplayLanguage)}
            required
            fullWidth
          >
            <MenuItem value="ja">日本語</MenuItem>
            <MenuItem value="vi">Tiếng Việt</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" disabled={submitting} fullWidth>
            {t('staff.createAccount.submit')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
