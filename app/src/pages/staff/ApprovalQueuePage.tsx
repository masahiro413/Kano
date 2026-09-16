import { Button, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePendingStudents } from '../../hooks/usePendingStudents'
import { setStudentApprovalStatus } from '../../lib/students'

// 承認待ちの生徒一覧。staffなら誰でもボタン一つで承認/拒否できる(SPEC §2.2)。
export function ApprovalQueuePage() {
  const { t } = useTranslation()
  const { students, loading } = usePendingStudents()
  const [processingUid, setProcessingUid] = useState<string | null>(null)

  async function handleDecision(uid: string, approve: boolean) {
    setProcessingUid(uid)
    try {
      await setStudentApprovalStatus(uid, approve ? 'approved' : 'rejected')
    } finally {
      setProcessingUid(null)
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1">
        {t('nav.approvals')}
      </Typography>
      {!loading && students.length === 0 && (
        <Typography color="text.secondary">{t('staff.approvalQueue.empty')}</Typography>
      )}
      <List>
        {students.map((student) => (
          <ListItem
            key={student.uid}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={processingUid === student.uid}
                  onClick={() => handleDecision(student.uid, true)}
                >
                  {t('staff.approvalQueue.approve')}
                </Button>
                <Button
                  size="small"
                  color="error"
                  disabled={processingUid === student.uid}
                  onClick={() => handleDecision(student.uid, false)}
                >
                  {t('staff.approvalQueue.reject')}
                </Button>
              </Stack>
            }
          >
            <ListItemText primary={student.displayName} secondary={student.email} />
          </ListItem>
        ))}
      </List>
    </Stack>
  )
}
