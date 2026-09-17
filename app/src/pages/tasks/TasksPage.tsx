import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/authContext'
import { useTasks } from '../../hooks/useTasks'
import { addTask, deleteTask, setTaskCompleted } from '../../lib/tasks'
import type { Priority, Task } from '../../types/firestore'

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
const PRIORITY_COLOR: Record<Priority, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
}

// タスク管理画面。生徒・staffいずれのロールでも使う共通ページで、
// データは所有ユーザー(uid)ごとに完全に独立している(SPEC §3)。
export function TasksPage() {
  const { t } = useTranslation()
  const { firebaseUser } = useAuth()
  const { tasks, loading } = useTasks(firebaseUser?.uid)

  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [sortByPriority, setSortByPriority] = useState(false)
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null)

  const visibleTasks = useMemo(() => {
    const filtered =
      priorityFilter === 'all'
        ? tasks
        : tasks.filter((task) => task.priority === priorityFilter)

    if (!sortByPriority) return filtered

    return [...filtered].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    )
  }, [tasks, priorityFilter, sortByPriority])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!firebaseUser || !newTitle.trim()) return
    await addTask(firebaseUser.uid, newTitle.trim(), newPriority)
    setNewTitle('')
  }

  async function handleConfirmDelete() {
    if (!taskPendingDelete) return
    await deleteTask(taskPendingDelete.id)
    setTaskPendingDelete(null)
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('tasks.title')}
      </Typography>

      <Box component="form" onSubmit={handleAdd} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            placeholder={t('tasks.newTaskPlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="high">{t('tasks.priority.high')}</MenuItem>
            <MenuItem value="medium">{t('tasks.priority.medium')}</MenuItem>
            <MenuItem value="low">{t('tasks.priority.low')}</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" disabled={!newTitle.trim()}>
            {t('common.add')}
          </Button>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <TextField
          select
          label={t('tasks.filter.priority')}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">{t('tasks.filter.all')}</MenuItem>
          <MenuItem value="high">{t('tasks.priority.high')}</MenuItem>
          <MenuItem value="medium">{t('tasks.priority.medium')}</MenuItem>
          <MenuItem value="low">{t('tasks.priority.low')}</MenuItem>
        </TextField>
        <Button
          size="small"
          variant={sortByPriority ? 'contained' : 'outlined'}
          onClick={() => setSortByPriority((v) => !v)}
        >
          {t('tasks.filter.sortByPriority')}
        </Button>
      </Stack>

      {!loading && visibleTasks.length === 0 && (
        <Typography color="text.secondary">{t('tasks.empty')}</Typography>
      )}

      <List>
        {visibleTasks.map((task) => (
          <ListItem
            key={task.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => setTaskPendingDelete(task)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={task.completed}
                onChange={(e) => setTaskCompleted(task.id, e.target.checked)}
              />
            </ListItemIcon>
            <ListItemText
              primary={task.title}
              sx={
                task.completed
                  ? { textDecoration: 'line-through', color: 'text.disabled' }
                  : undefined
              }
            />
            <Chip
              label={t(`tasks.priority.${task.priority}`)}
              color={PRIORITY_COLOR[task.priority]}
              size="small"
              sx={{ mr: 2 }}
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={!!taskPendingDelete} onClose={() => setTaskPendingDelete(null)}>
        <DialogTitle>{t('tasks.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{taskPendingDelete?.title}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskPendingDelete(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
