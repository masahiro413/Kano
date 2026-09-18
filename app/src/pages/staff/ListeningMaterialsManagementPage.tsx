import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import {
  Alert,
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
import { CourseLevelSelect } from '../../components/CourseLevelSelect'
import { useListeningMaterials } from '../../hooks/useListeningMaterials'
import {
  addListeningMaterial,
  deleteListeningMaterial,
  getListeningMaterialUrl,
  updateListeningMaterialMeta,
  type ListeningMaterialInput,
} from '../../lib/listeningMaterials'
import type { Level, ListeningMaterial } from '../../types/firestore'

const EMPTY_FORM: ListeningMaterialInput = {
  courseId: '',
  level: 'beginner',
  title: '',
  transcript: '',
}

// リスニング教材(音声素材)の管理画面。staffが録音した音声ファイルをアップロードする
// 方式のみ実装している(SPEC §4.3 (a))。TTS自動生成(b)は未実装 — 詳細はTASKS.md参照。
export function ListeningMaterialsManagementPage() {
  const { t } = useTranslation()
  const { materials, loading } = useListeningMaterials()

  const [creating, setCreating] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<ListeningMaterial | null>(null)
  const [form, setForm] = useState<ListeningMaterialInput>(EMPTY_FORM)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [materialPendingDelete, setMaterialPendingDelete] =
    useState<ListeningMaterial | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function openNew() {
    setCreating(true)
    setForm(EMPTY_FORM)
    setAudioFile(null)
    setError(null)
  }

  function openEdit(material: ListeningMaterial) {
    setEditingMaterial(material)
    setForm({
      courseId: material.courseId,
      level: material.level,
      title: material.title,
      transcript: material.transcript,
    })
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId || !audioFile) return
    setSubmitting(true)
    setError(null)
    try {
      await addListeningMaterial(form, audioFile)
      setCreating(false)
    } catch {
      setError(t('staff.listening.error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateMeta(e: FormEvent) {
    e.preventDefault()
    if (!editingMaterial || !form.title.trim() || !form.courseId) return
    await updateListeningMaterialMeta(editingMaterial.id, form)
    setEditingMaterial(null)
  }

  async function handleConfirmDelete() {
    if (!materialPendingDelete) return
    await deleteListeningMaterial(
      materialPendingDelete.id,
      materialPendingDelete.audioAssetPath,
    )
    setMaterialPendingDelete(null)
  }

  async function handlePlay(material: ListeningMaterial) {
    const url = await getListeningMaterialUrl(material.audioAssetPath)
    window.open(url, '_blank')
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('staff.listening.title')}
        </Typography>
        <Button variant="contained" onClick={openNew}>
          {t('staff.listening.add')}
        </Button>
      </Stack>

      {!loading && materials.length === 0 && (
        <Typography color="text.secondary">{t('staff.listening.empty')}</Typography>
      )}

      <List>
        {materials.map((material) => (
          <ListItem
            key={material.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton edge="end" onClick={() => handlePlay(material)}>
                  <PlayArrowIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => openEdit(material)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => setMaterialPendingDelete(material)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText primary={material.title} secondary={material.transcript} />
          </ListItem>
        ))}
      </List>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth>
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle>{t('staff.listening.add')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <CourseLevelSelect
                courseId={form.courseId}
                onCourseIdChange={(courseId) => setForm({ ...form, courseId })}
                level={form.level}
                onLevelChange={(level: Level) => setForm({ ...form, level })}
              />
              <TextField
                label={t('staff.listening.materialTitle')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label={t('staff.listening.transcript')}
                value={form.transcript}
                onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                fullWidth
                multiline
                minRows={3}
              />
              <Button component="label" variant="outlined">
                {audioFile ? audioFile.name : t('staff.listening.chooseFile')}
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreating(false)}>{t('common.cancel')}</Button>
            <Button
              type="submit"
              disabled={submitting || !form.title.trim() || !form.courseId || !audioFile}
            >
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={editingMaterial !== null}
        onClose={() => setEditingMaterial(null)}
        fullWidth
      >
        <Box component="form" onSubmit={handleUpdateMeta}>
          <DialogTitle>{t('staff.listening.edit')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <CourseLevelSelect
                courseId={form.courseId}
                onCourseIdChange={(courseId) => setForm({ ...form, courseId })}
                level={form.level}
                onLevelChange={(level: Level) => setForm({ ...form, level })}
              />
              <TextField
                label={t('staff.listening.materialTitle')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label={t('staff.listening.transcript')}
                value={form.transcript}
                onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                fullWidth
                multiline
                minRows={3}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingMaterial(null)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={!form.title.trim() || !form.courseId}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={!!materialPendingDelete}
        onClose={() => setMaterialPendingDelete(null)}
      >
        <DialogTitle>{t('staff.listening.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{materialPendingDelete?.title}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialPendingDelete(null)}>
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
