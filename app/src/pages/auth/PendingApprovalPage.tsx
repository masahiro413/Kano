import { Box, Button, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { signOutUser } from '../../lib/firebaseAuth'

// 承認待ちの生徒に表示する専用画面。ログインはできるがこの画面以外へは遷移させない(SPEC §2.2)。
export function PendingApprovalPage() {
  const { t } = useTranslation()

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 8, px: 2, textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('pendingApproval.title')}
      </Typography>
      <Typography sx={{ mb: 3 }}>{t('pendingApproval.message')}</Typography>
      <Button variant="outlined" onClick={() => signOutUser()}>
        {t('auth.logout')}
      </Button>
    </Box>
  )
}
