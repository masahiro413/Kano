import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

const LINKS = [
  { to: '/staff/content/courses', labelKey: 'staff.courses.title' },
  { to: '/staff/content/questions', labelKey: 'staff.questionSets.title' },
  { to: '/staff/content/vocab', labelKey: 'staff.vocab.title' },
  { to: '/staff/content/listening', labelKey: 'staff.listening.title' },
] as const

// コンテンツ管理のハブ画面。コース・問題集・単語帳・リスニング教材の
// それぞれの管理画面へのリンクを提供する(SPEC §4.2, §4.3)。
export function ContentManagementPage() {
  const { t } = useTranslation()

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {t('nav.content')}
      </Typography>
      <Stack spacing={2}>
        {LINKS.map((link) => (
          <Card key={link.to}>
            <CardActionArea component={RouterLink} to={link.to}>
              <CardContent>
                <Typography variant="h6">{t(link.labelKey)}</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
