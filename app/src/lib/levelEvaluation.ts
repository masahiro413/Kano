import type { Level, LevelThresholdSettings } from '../types/firestore'

const LEVEL_ORDER: Level[] = ['beginner', 'intermediate', 'advanced']

// プレースメントテストの正答率から初期レベルを固定閾値で判定する(SPEC §4.2.2)。
// 例: 80%以上=上級、40〜79%=中級、40%未満=初級
export function determineInitialLevel(
  scorePercent: number,
  settings: LevelThresholdSettings,
): Level {
  if (scorePercent >= settings.placementAdvancedMin) return 'advanced'
  if (scorePercent >= settings.placementIntermediateMin) return 'intermediate'
  return 'beginner'
}

// 直近N問の正答率からレベル自動昇降級を判定する(SPEC §4.2.1、ヒステリシス設計)。
// 例: 直近20問の正答率が80%を超えたら昇級、40%を下回ったら降級、40〜80%は現状維持。
// 直近の解答数がN問に満たない場合や、既に最上位/最下位レベルの場合は変更しない。
export function evaluatePromotionDemotion(
  recentCorrectFlags: boolean[],
  currentLevel: Level,
  settings: LevelThresholdSettings,
): Level | null {
  if (recentCorrectFlags.length < settings.recentQuestionCount) return null

  const correctCount = recentCorrectFlags.filter(Boolean).length
  const percent = (correctCount / recentCorrectFlags.length) * 100
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel)

  if (percent > settings.promotionThreshold && currentIndex < LEVEL_ORDER.length - 1) {
    return LEVEL_ORDER[currentIndex + 1]
  }
  if (percent < settings.demotionThreshold && currentIndex > 0) {
    return LEVEL_ORDER[currentIndex - 1]
  }
  return null
}
