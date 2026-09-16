import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCourses } from '../../hooks/useCourses'
import { registerStudent } from '../../lib/firebaseAuth'
import type { DisplayLanguage } from '../../types/firestore'

// 生徒のセルフサインアップ画面。登録直後は承認待ち状態になる(SPEC §2.2)。
export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { courses, loading: coursesLoading } = useCourses()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [courseId, setCourseId] = useState('')
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('ja')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await registerStudent({
        email,
        password,
        displayName,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        courseId,
        displayLanguage,
      })
      navigate('/pending-approval')
    } catch {
      setError(t('registration.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6, mb: 6, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('auth.register')}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
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
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            fullWidth
          />
          <TextField
            label={t('registration.phoneNumber')}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
          />
          <TextField
            label={t('registration.address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label={t('registration.course')}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            fullWidth
            disabled={coursesLoading}
            helperText={
              !coursesLoading && courses.length === 0
                ? t('registration.noCourses')
                : undefined
            }
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </TextField>
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
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !courseId}
            fullWidth
          >
            {t('registration.submit')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
