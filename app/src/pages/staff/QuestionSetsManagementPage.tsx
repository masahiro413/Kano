import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ListAltIcon from '@mui/icons-material/ListAlt'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { CourseLevelSelect } from '../../components/CourseLevelSelect'
import { useQuestionSets } from '../../hooks/useQuestionSets'
import {
  addQuestionSet,
  deleteQuestionSet,
  updateQuestionSet,
  type QuestionSetInput,
} from '../../lib/questionSets'
import type { Level, QuestionSet } from '../../types/firestore'

const EMPTY_FORM: QuestionSetInput = {
  courseId: '',
  level: 'beginner',
  title: '',
  description: '',
  isPlacementTest: false,
}

// 問題集の作成/編集/削除画面(SPEC §4.1, §4.2.2)。
// 個々の問題(設問)の編集は詳細ページ(QuestionSetDetailPage)で行う。
export function QuestionSetsManagementPage() {
  const { t } = useTranslation()
  const { questionSets, loading } = useQuestionSets()

  const [editingSet, setEditingSet] = useState<QuestionSet | 'new' | null>(null)
  const [form, setForm] = useState<QuestionSetInput>(EMPTY_FORM)
  const [setPendingDelete, setSetPendingDelete] = useState<QuestionSet | null>(null)

  function openNew() {
    setEditingSet('new')
    setForm(EMPTY_FORM)
  }

  function openEdit(set: QuestionSet) {
    setEditingSet(set)
    setForm({
      courseId: set.courseId,
      level: set.level,
      title: set.title,
      description: set.description ?? '',
      isPlacementTest: set.isPlacementTest,
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId) return
    if (editingSet === 'new') {
      await addQuestionSet(form)
    } else if (editingSet) {
      await updateQuestionSet(editingSet.id, form)
    }
    setEditingSet(null)
  }

  async function handleConfirmDelete() {
    if (!setPendingDelete) return
    await deleteQuestionSet(setPendingDelete.id)
    setSetPendingDelete(null)
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('staff.questionSets.title')}
        </Typography>
        <Button variant="contained" onClick={openNew}>
          {t('staff.questionSets.add')}
        </Button>
      </Stack>

      {!loading && questionSets.length === 0 && (
        <Typography color="text.secondary">{t('staff.questionSets.empty')}</Typography>
      )}

      <List>
        {questionSets.map((set) => (
          <ListItem
            key={set.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton
                  edge="end"
                  component={RouterLink}
                  to={`/staff/content/questions/${set.id}`}
                >
                  <ListAltIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => openEdit(set)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => setSetPendingDelete(set)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText
              primary={set.title}
              secondary={
                set.isPlacementTest
                  ? t('staff.questionSets.placementTest')
                  : set.description
              }
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={editingSet !== null} onClose={() => setEditingSet(null)} fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {editingSet === 'new'
              ? t('staff.questionSets.add')
              : t('staff.questionSets.edit')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <CourseLevelSelect
                courseId={form.courseId}
                onCourseIdChange={(courseId) => setForm({ ...form, courseId })}
                level={form.level}
                onLevelChange={(level: Level) => setForm({ ...form, level })}
              />
              <TextField
                label={t('staff.questionSets.name')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label={t('staff.questionSets.description')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isPlacementTest}
                    onChange={(e) =>
                      setForm({ ...form, isPlacementTest: e.target.checked })
                    }
                  />
                }
                label={t('staff.questionSets.isPlacementTest')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingSet(null)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!form.title.trim() || !form.courseId}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!setPendingDelete} onClose={() => setSetPendingDelete(null)}>
        <DialogTitle>{t('staff.questionSets.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{setPendingDelete?.title}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetPendingDelete(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
