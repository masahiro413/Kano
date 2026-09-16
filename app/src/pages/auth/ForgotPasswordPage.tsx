import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { sendPasswordReset } from '../../lib/firebaseAuth'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch {
      setError(t('auth.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('auth.forgotPassword')}
      </Typography>
      {sent ? (
        <Alert severity="success">{t('auth.resetEmailSent')}</Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={submitting} fullWidth>
              {t('auth.forgotPasswordSubmit')}
            </Button>
          </Stack>
        </Box>
      )}
      <Box sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/login">
          {t('auth.backToLogin')}
        </Link>
      </Box>
    </Box>
  )
}
