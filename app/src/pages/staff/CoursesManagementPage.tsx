import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  Box,
  Button,
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
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCourses } from '../../hooks/useCourses'
import { addCourse, deleteCourse, updateCourse } from '../../lib/courses'
import type { Course } from '../../types/firestore'

// コース(科目区分)の作成/編集/削除画面(SPEC §4.2)。
// 生徒登録フォームのコース選択はここで作成したコースを参照する。
export function CoursesManagementPage() {
  const { t } = useTranslation()
  const { courses, loading } = useCourses()

  const [editingCourse, setEditingCourse] = useState<Course | 'new' | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coursePendingDelete, setCoursePendingDelete] = useState<Course | null>(null)

  function openNew() {
    setEditingCourse('new')
    setName('')
    setDescription('')
  }

  function openEdit(course: Course) {
    setEditingCourse(course)
    setName(course.name)
    setDescription(course.description)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (editingCourse === 'new') {
      await addCourse(name.trim(), description.trim())
    } else if (editingCourse) {
      await updateCourse(editingCourse.id, name.trim(), description.trim())
    }
    setEditingCourse(null)
  }

  async function handleConfirmDelete() {
    if (!coursePendingDelete) return
    await deleteCourse(coursePendingDelete.id)
    setCoursePendingDelete(null)
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('staff.courses.title')}
        </Typography>
        <Button variant="contained" onClick={openNew}>
          {t('staff.courses.add')}
        </Button>
      </Stack>

      {!loading && courses.length === 0 && (
        <Typography color="text.secondary">{t('staff.courses.empty')}</Typography>
      )}

      <List>
        {courses.map((course) => (
          <ListItem
            key={course.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton edge="end" onClick={() => openEdit(course)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => setCoursePendingDelete(course)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText primary={course.name} secondary={course.description} />
          </ListItem>
        ))}
      </List>

      <Dialog
        open={editingCourse !== null}
        onClose={() => setEditingCourse(null)}
        fullWidth
      >
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {editingCourse === 'new' ? t('staff.courses.add') : t('staff.courses.edit')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label={t('staff.courses.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label={t('staff.courses.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingCourse(null)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!name.trim()}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!coursePendingDelete} onClose={() => setCoursePendingDelete(null)}>
        <DialogTitle>{t('staff.courses.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{coursePendingDelete?.name}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoursePendingDelete(null)}>
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
