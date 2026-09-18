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
import { CourseLevelSelect } from '../../components/CourseLevelSelect'
import { useVocabCards } from '../../hooks/useVocabCards'
import {
  addVocabCard,
  deleteVocabCard,
  updateVocabCard,
  type VocabCardInput,
} from '../../lib/vocabCards'
import type { Level, VocabCard } from '../../types/firestore'

const EMPTY_FORM: VocabCardInput = {
  courseId: '',
  level: 'beginner',
  term: '',
  meaning: '',
  exampleSentence: '',
}

// 単語帳カードの作成/編集/削除画面(SPEC §4.1, §4.3)。
// SRS(間隔反復)の復習スケジューリング自体はPhase 6で実装する。
export function VocabCardsManagementPage() {
  const { t } = useTranslation()
  const { cards, loading } = useVocabCards()

  const [editingCard, setEditingCard] = useState<VocabCard | 'new' | null>(null)
  const [form, setForm] = useState<VocabCardInput>(EMPTY_FORM)
  const [cardPendingDelete, setCardPendingDelete] = useState<VocabCard | null>(null)

  function openNew() {
    setEditingCard('new')
    setForm(EMPTY_FORM)
  }

  function openEdit(card: VocabCard) {
    setEditingCard(card)
    setForm({
      courseId: card.courseId,
      level: card.level,
      term: card.term,
      meaning: card.meaning,
      exampleSentence: card.exampleSentence ?? '',
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.term.trim() || !form.meaning.trim() || !form.courseId) return
    if (editingCard === 'new') {
      await addVocabCard(form)
    } else if (editingCard) {
      await updateVocabCard(editingCard.id, form)
    }
    setEditingCard(null)
  }

  async function handleConfirmDelete() {
    if (!cardPendingDelete) return
    await deleteVocabCard(cardPendingDelete.id)
    setCardPendingDelete(null)
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {t('staff.vocab.title')}
        </Typography>
        <Button variant="contained" onClick={openNew}>
          {t('staff.vocab.add')}
        </Button>
      </Stack>

      {!loading && cards.length === 0 && (
        <Typography color="text.secondary">{t('staff.vocab.empty')}</Typography>
      )}

      <List>
        {cards.map((card) => (
          <ListItem
            key={card.id}
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton edge="end" onClick={() => openEdit(card)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => setCardPendingDelete(card)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText primary={card.term} secondary={card.meaning} />
          </ListItem>
        ))}
      </List>

      <Dialog open={editingCard !== null} onClose={() => setEditingCard(null)} fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {editingCard === 'new' ? t('staff.vocab.add') : t('staff.vocab.edit')}
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
                label={t('staff.vocab.term')}
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label={t('staff.vocab.meaning')}
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label={t('staff.vocab.exampleSentence')}
                value={form.exampleSentence}
                onChange={(e) => setForm({ ...form, exampleSentence: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingCard(null)}>{t('common.cancel')}</Button>
            <Button
              type="submit"
              disabled={!form.term.trim() || !form.meaning.trim() || !form.courseId}
            >
              {t('common.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={!!cardPendingDelete} onClose={() => setCardPendingDelete(null)}>
        <DialogTitle>{t('staff.vocab.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{cardPendingDelete?.term}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCardPendingDelete(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
