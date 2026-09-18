import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { QuestionEditorDialog } from '../../components/QuestionEditorDialog'
import { useQuestionSets } from '../../hooks/useQuestionSets'
import { useQuestions } from '../../hooks/useQuestions'
import {
  addQuestion,
  deleteQuestion,
  updateQuestion,
  type QuestionInput,
} from '../../lib/questions'
import type { Question } from '../../types/firestore'

// 問題集配下の個々の問題(設問)の作成/編集/削除画面(SPEC §4.1)。
export function QuestionSetDetailPage() {
  const { t } = useTranslation()
  const { setId } = useParams<{ setId: string }>()
  const { questionSets } = useQuestionSets()
  const { questions, loading } = useQuestions(setId ?? '')

  const [editingQuestion, setEditingQuestion] = useState<Question | 'new' | null>(null)
  const [questionPendingDelete, setQuestionPendingDelete] = useState<Question | null>(
    null,
  )

  const set = questionSets.find((s) => s.id === setId)

  async function handleSubmit(input: QuestionInput) {
    if (!setId) return
    if (editingQuestion === 'new') {
      await addQuestion(setId, input)
    } else if (editingQuestion) {
      await updateQuestion(setId, editingQuestion.id, input)
    }
    setEditingQuestion(null)
  }

  async function handleConfirmDelete() {
    if (!setId || !questionPendingDelete) return
    await deleteQuestion(setId, questionPendingDelete.id)
    setQuestionPendingDelete(null)
  }

  if (!setId) return null

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Button
        component={RouterLink}
        to="/staff/content/questions"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        {t('staff.questionSets.title')}
      </Button>

      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {set?.title ?? ''}
        </Typography>
        <Button variant="contained" onClick={() => setEditingQuestion('new')}>
          {t('staff.questions.add')}
        </Button>
      </Stack>

      {!loading && questions.length === 0 && (
        <Typography color="text.secondary">{t('staff.questions.empty')}</Typography>
      )}

      <List>
        {questions.map((question) => (
          <ListItem
            key={question.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton edge="end" onClick={() => setEditingQuestion(question)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => setQuestionPendingDelete(question)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Chip
                    size="small"
                    label={t(`staff.questions.formats.${question.format}`)}
                  />
                  <Typography component="span">{question.promptText}</Typography>
                </Stack>
              }
            />
          </ListItem>
        ))}
      </List>

      <QuestionEditorDialog
        key={editingQuestion === 'new' ? 'new' : (editingQuestion?.id ?? 'closed')}
        open={editingQuestion !== null}
        editingQuestion={editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={!!questionPendingDelete}
        onClose={() => setQuestionPendingDelete(null)}
      >
        <DialogTitle>{t('staff.questions.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{questionPendingDelete?.promptText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionPendingDelete(null)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
