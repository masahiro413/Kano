import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useListeningMaterials } from '../hooks/useListeningMaterials'
import type { QuestionInput } from '../lib/questions'
import type {
  DialogueTurn,
  Question,
  QuestionFormat,
  RoleplayTurn,
} from '../types/firestore'

const FORMATS: QuestionFormat[] = [
  'choice',
  'free_text',
  'reorder',
  'error_identification',
  'pronunciation',
  'roleplay',
]

// 改行区切りのテキストエリアと string[] 相互変換用ヘルパー
function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

interface FormState {
  format: QuestionFormat
  promptText: string
  explanation: string
  listeningMaterialId: string
  dialogueTurns: DialogueTurn[]
  choicesText: string
  correctIndex: number
  acceptedAnswersText: string
  piecesText: string
  segmentsText: string
  incorrectSegmentIndex: number
  targetText: string
  turns: RoleplayTurn[]
}

const EMPTY_FORM: FormState = {
  format: 'choice',
  promptText: '',
  explanation: '',
  listeningMaterialId: '',
  dialogueTurns: [],
  choicesText: '',
  correctIndex: 0,
  acceptedAnswersText: '',
  piecesText: '',
  segmentsText: '',
  incorrectSegmentIndex: 0,
  targetText: '',
  turns: [],
}

function questionToForm(question: Question): FormState {
  const base: FormState = {
    ...EMPTY_FORM,
    format: question.format,
    promptText: question.promptText,
    explanation: question.explanation ?? '',
    listeningMaterialId: question.listeningMaterialId ?? '',
    dialogueTurns: question.dialogueTurns ?? [],
  }
  switch (question.format) {
    case 'choice':
      return {
        ...base,
        choicesText: question.choices.join('\n'),
        correctIndex: question.correctIndex,
      }
    case 'free_text':
      return { ...base, acceptedAnswersText: question.acceptedAnswers.join('\n') }
    case 'reorder':
      return { ...base, piecesText: question.pieces.join('\n') }
    case 'error_identification':
      return {
        ...base,
        segmentsText: question.segments.join('\n'),
        incorrectSegmentIndex: question.incorrectSegmentIndex,
      }
    case 'pronunciation':
      return { ...base, targetText: question.targetText }
    case 'roleplay':
      return { ...base, turns: question.turns }
  }
}

function formToInput(form: FormState): QuestionInput {
  const base = {
    promptText: form.promptText,
    explanation: form.explanation.trim() || undefined,
    listeningMaterialId: form.listeningMaterialId || undefined,
    dialogueTurns: form.dialogueTurns.length > 0 ? form.dialogueTurns : undefined,
  }
  switch (form.format) {
    case 'choice':
      return {
        ...base,
        format: 'choice',
        choices: linesToArray(form.choicesText),
        correctIndex: form.correctIndex,
      }
    case 'free_text':
      return {
        ...base,
        format: 'free_text',
        acceptedAnswers: linesToArray(form.acceptedAnswersText),
      }
    case 'reorder':
      return { ...base, format: 'reorder', pieces: linesToArray(form.piecesText) }
    case 'error_identification':
      return {
        ...base,
        format: 'error_identification',
        segments: linesToArray(form.segmentsText),
        incorrectSegmentIndex: form.incorrectSegmentIndex,
      }
    case 'pronunciation':
      return { ...base, format: 'pronunciation', targetText: form.targetText }
    case 'roleplay':
      return { ...base, format: 'roleplay', turns: form.turns }
  }
}

function isFormValid(form: FormState): boolean {
  if (!form.promptText.trim()) return false
  switch (form.format) {
    case 'choice':
      return linesToArray(form.choicesText).length >= 2
    case 'free_text':
      return linesToArray(form.acceptedAnswersText).length >= 1
    case 'reorder':
      return linesToArray(form.piecesText).length >= 2
    case 'error_identification':
      return linesToArray(form.segmentsText).length >= 2
    case 'pronunciation':
      return form.targetText.trim().length > 0
    case 'roleplay':
      return form.turns.length >= 1
  }
}

interface QuestionEditorDialogProps {
  open: boolean
  editingQuestion: Question | 'new' | null
  onClose: () => void
  onSubmit: (input: QuestionInput) => Promise<void>
}

// SPEC §4.1で列挙された全出題形式を1つの合成フォームで編集する。
// formatを切り替えると、その形式に必要なフィールドのみ表示する。
export function QuestionEditorDialog({
  open,
  editingQuestion,
  onClose,
  onSubmit,
}: QuestionEditorDialogProps) {
  const { t } = useTranslation()
  const { materials } = useListeningMaterials()
  const [form, setForm] = useState<FormState>(() =>
    editingQuestion && editingQuestion !== 'new'
      ? questionToForm(editingQuestion)
      : EMPTY_FORM,
  )
  const [submitting, setSubmitting] = useState(false)

  function addDialogueTurn() {
    setForm({
      ...form,
      dialogueTurns: [...form.dialogueTurns, { speaker: '', text: '' }],
    })
  }

  function updateDialogueTurn(index: number, turn: DialogueTurn) {
    const next = [...form.dialogueTurns]
    next[index] = turn
    setForm({ ...form, dialogueTurns: next })
  }

  function removeDialogueTurn(index: number) {
    setForm({ ...form, dialogueTurns: form.dialogueTurns.filter((_, i) => i !== index) })
  }

  function addRoleplayTurn() {
    setForm({
      ...form,
      turns: [...form.turns, { speaker: '', text: '', studentSpeaks: false }],
    })
  }

  function updateRoleplayTurn(index: number, turn: RoleplayTurn) {
    const next = [...form.turns]
    next[index] = turn
    setForm({ ...form, turns: next })
  }

  function removeRoleplayTurn(index: number) {
    setForm({ ...form, turns: form.turns.filter((_, i) => i !== index) })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isFormValid(form)) return
    setSubmitting(true)
    try {
      await onSubmit(formToInput(form))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>
          {editingQuestion === 'new'
            ? t('staff.questions.add')
            : t('staff.questions.edit')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={t('staff.questions.format')}
              value={form.format}
              onChange={(e) =>
                setForm({ ...form, format: e.target.value as QuestionFormat })
              }
              disabled={editingQuestion !== 'new'}
              fullWidth
            >
              {FORMATS.map((format) => (
                <MenuItem key={format} value={format}>
                  {t(`staff.questions.formats.${format}`)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={t('staff.questions.promptText')}
              value={form.promptText}
              onChange={(e) => setForm({ ...form, promptText: e.target.value })}
              required
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              select
              label={t('staff.questions.listeningMaterial')}
              value={form.listeningMaterialId}
              onChange={(e) => setForm({ ...form, listeningMaterialId: e.target.value })}
              fullWidth
            >
              <MenuItem value="">{t('staff.questions.none')}</MenuItem>
              {materials.map((material) => (
                <MenuItem key={material.id} value={material.id}>
                  {material.title}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('staff.questions.dialogueTurns')}
              </Typography>
              <Stack spacing={1}>
                {form.dialogueTurns.map((turn, index) => (
                  <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label={t('staff.questions.speaker')}
                      value={turn.speaker}
                      onChange={(e) =>
                        updateDialogueTurn(index, { ...turn, speaker: e.target.value })
                      }
                      sx={{ width: { xs: '100%', sm: 120 } }}
                    />
                    <TextField
                      label={t('staff.questions.text')}
                      value={turn.text}
                      onChange={(e) =>
                        updateDialogueTurn(index, { ...turn, text: e.target.value })
                      }
                      fullWidth
                    />
                    <IconButton onClick={() => removeDialogueTurn(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button size="small" onClick={addDialogueTurn} sx={{ mt: 1 }}>
                {t('staff.questions.addTurn')}
              </Button>
            </Box>

            {form.format === 'choice' && (
              <>
                <TextField
                  label={t('staff.questions.choices')}
                  helperText={t('staff.questions.oneLinePerItem')}
                  value={form.choicesText}
                  onChange={(e) => setForm({ ...form, choicesText: e.target.value })}
                  fullWidth
                  multiline
                  minRows={3}
                  required
                />
                <TextField
                  type="number"
                  label={t('staff.questions.correctIndex')}
                  value={form.correctIndex}
                  onChange={(e) =>
                    setForm({ ...form, correctIndex: Number(e.target.value) })
                  }
                  fullWidth
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </>
            )}

            {form.format === 'free_text' && (
              <TextField
                label={t('staff.questions.acceptedAnswers')}
                helperText={t('staff.questions.oneLinePerItem')}
                value={form.acceptedAnswersText}
                onChange={(e) =>
                  setForm({ ...form, acceptedAnswersText: e.target.value })
                }
                fullWidth
                multiline
                minRows={3}
                required
              />
            )}

            {form.format === 'reorder' && (
              <TextField
                label={t('staff.questions.pieces')}
                helperText={t('staff.questions.oneLinePerItem')}
                value={form.piecesText}
                onChange={(e) => setForm({ ...form, piecesText: e.target.value })}
                fullWidth
                multiline
                minRows={3}
                required
              />
            )}

            {form.format === 'error_identification' && (
              <>
                <TextField
                  label={t('staff.questions.segments')}
                  helperText={t('staff.questions.oneLinePerItem')}
                  value={form.segmentsText}
                  onChange={(e) => setForm({ ...form, segmentsText: e.target.value })}
                  fullWidth
                  multiline
                  minRows={3}
                  required
                />
                <TextField
                  type="number"
                  label={t('staff.questions.incorrectSegmentIndex')}
                  value={form.incorrectSegmentIndex}
                  onChange={(e) =>
                    setForm({ ...form, incorrectSegmentIndex: Number(e.target.value) })
                  }
                  fullWidth
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </>
            )}

            {form.format === 'pronunciation' && (
              <TextField
                label={t('staff.questions.targetText')}
                value={form.targetText}
                onChange={(e) => setForm({ ...form, targetText: e.target.value })}
                fullWidth
                required
              />
            )}

            {form.format === 'roleplay' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('staff.questions.roleplayTurns')}
                </Typography>
                <Stack spacing={1}>
                  {form.turns.map((turn, index) => (
                    <Stack
                      key={index}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                    >
                      <TextField
                        label={t('staff.questions.speaker')}
                        value={turn.speaker}
                        onChange={(e) =>
                          updateRoleplayTurn(index, { ...turn, speaker: e.target.value })
                        }
                        sx={{ width: { xs: '100%', sm: 120 } }}
                      />
                      <TextField
                        label={t('staff.questions.text')}
                        value={turn.text}
                        onChange={(e) =>
                          updateRoleplayTurn(index, { ...turn, text: e.target.value })
                        }
                        fullWidth
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={turn.studentSpeaks}
                            onChange={(e) =>
                              updateRoleplayTurn(index, {
                                ...turn,
                                studentSpeaks: e.target.checked,
                              })
                            }
                          />
                        }
                        label={t('staff.questions.studentSpeaks')}
                      />
                      <IconButton onClick={() => removeRoleplayTurn(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
                <Button size="small" onClick={addRoleplayTurn} sx={{ mt: 1 }}>
                  {t('staff.questions.addTurn')}
                </Button>
              </Box>
            )}

            <TextField
              label={t('staff.questions.explanation')}
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={submitting || !isFormValid(form)}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
