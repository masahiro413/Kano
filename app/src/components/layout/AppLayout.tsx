import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'

// 生徒/staffで共通のアプリシェル。メニュー項目はロールに応じて出し分ける。
export function AppLayout() {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()
  const isStaff = profile?.role === 'staff'

  return (
    <Box>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('common.appName')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/">
              {t('nav.dashboard')}
            </Button>
            <Button component={RouterLink} to="/tasks">
              {t('nav.tasks')}
            </Button>
            <Button component={RouterLink} to="/learning">
              {t('nav.learning')}
            </Button>
            {isStaff && (
              <>
                <Button component={RouterLink} to="/staff/approvals">
                  {t('nav.approvals')}
                </Button>
                <Button component={RouterLink} to="/staff/content">
                  {t('nav.content')}
                </Button>
              </>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => i18n.changeLanguage('ja')}>
              日本語
            </Button>
            <Button size="small" onClick={() => i18n.changeLanguage('vi')}>
              Tiếng Việt
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Box>
    </Box>
  )
}
