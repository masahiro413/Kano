// Azure AI Speech の Pronunciation Assessment との連携(SPEC §4.5)。
//
// Azureの購読キーをクライアントに直接置くことはできない(TTS自動生成・Anamの
// セッショントークンと同じ理由。SPEC §8参照)。本番運用にはCloud Functions等の
// サーバーレス関数経由でトークンを発行する実装が必要になる見込みだが、まだ
// 着手していない(Phase 7.1、ユーザー確認済みの方針)。
//
// CLAUDE.mdの「外部AI APIの呼び出し箇所は一箇所にまとめておく」という方針に従い、
// 将来の実装のためこの関数を呼び出し口として先に用意しておく。現時点ではどこからも
// 呼び出されていない(components/QuestionAnswerInputのpronunciation形式は録音UIのみ
// 提供し、この関数は呼んでいない)。

export interface PronunciationAssessmentResult {
  accuracyScore: number
  fluencyScore: number
  completenessScore: number
}

// audioBlob: 録音した音声(PronunciationRecorderが生成するBlob)
// targetText: 発音対象のテキスト(Question.targetText)
export async function assessPronunciation(
  audioBlob: Blob,
  targetText: string,
): Promise<PronunciationAssessmentResult> {
  void audioBlob
  void targetText
  throw new Error(
    'Azure Pronunciation Assessmentとの連携は未実装です(TASKS.md Phase 7.1参照)',
  )
}
