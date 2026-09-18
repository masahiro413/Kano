import { MenuItem, Stack, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useCourses } from '../hooks/useCourses'
import type { Level } from '../types/firestore'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']

interface CourseLevelSelectProps {
  courseId: string
  onCourseIdChange: (courseId: string) => void
  level: Level
  onLevelChange: (level: Level) => void
}

// 問題集・単語帳・リスニング教材の作成/編集フォームで共通利用する
// コース×レベルのタグ付けUI(SPEC §4.2, §4.3)。
export function CourseLevelSelect({
  courseId,
  onCourseIdChange,
  level,
  onLevelChange,
}: CourseLevelSelectProps) {
  const { t } = useTranslation()
  const { courses } = useCourses()

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <TextField
        select
        label={t('registration.course')}
        value={courseId}
        onChange={(e) => onCourseIdChange(e.target.value)}
        required
        fullWidth
      >
        {courses.map((course) => (
          <MenuItem key={course.id} value={course.id}>
            {course.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label={t('staff.level')}
        value={level}
        onChange={(e) => onLevelChange(e.target.value as Level)}
        required
        fullWidth
      >
        {LEVELS.map((l) => (
          <MenuItem key={l} value={l}>
            {t(`staff.levels.${l}`)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}
