// Firestoreドキュメントの型定義。SPEC.md §1, §2, §3, §4 のデータモデルに対応する。
// 実装が進むにつれてコレクション追加時はここに型を追記する。

export type UserRole = 'student' | 'staff'
export type DisplayLanguage = 'ja' | 'vi'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type Level = 'beginner' | 'intermediate' | 'advanced'
export type EvaluationDialect = 'northern' | 'southern'
export type Priority = 'high' | 'medium' | 'low'

// users/{uid}
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  displayLanguage: DisplayLanguage
  createdAt: string
}

// users/{uid} の生徒固有フィールド(roleが'student'の場合)
export interface StudentProfile extends UserProfile {
  role: 'student'
  approvalStatus: ApprovalStatus
  phoneNumber?: string
  address?: string
  courseId: string
  // プレースメントテスト受験前はレベル未確定(SPEC §4.2.2)。
  level: Level | null
  placementTestCompleted: boolean
  // 登録時点では選択項目がないため北部標準をデフォルトとし、staffが後から調整する想定。
  evaluationDialect: EvaluationDialect
}

// users/{uid} — roleが'staff'の場合。講師と管理者は権限上区別しない(SPEC §1)
export interface StaffProfile extends UserProfile {
  role: 'staff'
}

// courses/{courseId}
export interface Course {
  id: string
  name: string
  description: string
}

// tasks/{taskId} — 所有者(uid)ごとに完全に独立したデータ(SPEC §3)
export interface Task {
  id: string
  ownerUid: string
  title: string
  priority: Priority
  completed: boolean
  createdAt: string
}

// levelChanges/{changeId} — SPEC §4.2.1
export interface LevelChange {
  id: string
  studentUid: string
  fromLevel: Level
  toLevel: Level
  reason: 'placement_test' | 'auto_promotion' | 'auto_demotion'
  createdAt: string
}

// pronunciationApiUsageLogs/{logId} — SPEC §4.5 利用ログ(制限は未実装だが記録のみ行う)
export interface PronunciationApiUsageLog {
  id: string
  studentUid: string
  durationSeconds: number
  createdAt: string
}

// ---- 学習コンテンツ(SPEC §4.1〜§4.3、Phase 3) ----

// listeningMaterials/{materialId} — リスニング音声の素材ライブラリ。
// 複数の問題(リスニング問題・会話文の内容理解)から参照される(SPEC §4.3)。
export type AudioSource = 'upload' | 'tts'

export interface ListeningMaterial {
  id: string
  courseId: string
  level: Level
  title: string
  transcript: string
  audioAssetPath: string // Firebase Storage上のパス
  source: AudioSource
  createdAt: string
}

// questionSets/{setId} — 「問題集」に相当する、出題される問題の集合。
// プレースメントテストもこの型を使い、isPlacementTestで区別する(SPEC §4.2.2)。
export interface QuestionSet {
  id: string
  courseId: string
  level: Level
  title: string
  description?: string
  isPlacementTest: boolean
  createdAt: string
}

// questionSets/{setId}/questions/{questionId}
// SPEC §4.1で列挙された全形式を、共通フィールド+形式別フィールドの合成で表現する。
// 「選択式」「穴埋め・記述式」「並び替え」「誤り指摘」「発音」「ロールプレイ」の
// 6つの回答形式(format)を軸に、audioAssetPath(リスニング)・dialogueTurns(会話文の
// 文脈)を任意で組み合わせることで、文法問題・会話文問題を含む全パターンを表現する。
export type QuestionFormat =
  | 'choice'
  | 'free_text'
  | 'reorder'
  | 'error_identification'
  | 'pronunciation'
  | 'roleplay'

export interface DialogueTurn {
  speaker: string
  text: string
}

export interface RoleplayTurn extends DialogueTurn {
  studentSpeaks: boolean
}

interface QuestionBase {
  id: string
  format: QuestionFormat
  promptText: string
  explanation?: string
  // リスニング問題・会話文の内容理解で使用(SPEC §4.1.2)。
  listeningMaterialId?: string
  // 対話の空欄補充・内容理解の文脈として使用(SPEC §4.1.2)。
  dialogueTurns?: DialogueTurn[]
  createdAt: string
}

export type Question =
  | (QuestionBase & {
      format: 'choice'
      choices: string[]
      correctIndex: number
    })
  | (QuestionBase & {
      format: 'free_text'
      // 表記ゆれに対応するため複数の正解パターンを許容する(SPEC §4.1.3)。
      acceptedAnswers: string[]
    })
  | (QuestionBase & {
      format: 'reorder'
      // 正しい語順で並んだピース配列。出題時にシャッフルして表示する。
      pieces: string[]
    })
  | (QuestionBase & {
      format: 'error_identification'
      segments: string[]
      incorrectSegmentIndex: number
    })
  | (QuestionBase & {
      format: 'pronunciation'
      targetText: string
    })
  | (QuestionBase & {
      format: 'roleplay'
      turns: RoleplayTurn[]
    })

// vocabCards/{cardId} — 単語帳のカード本体。SRSの復習スケジュールは別途
// 生徒ごとのレビュー履歴として管理する(Phase 6)。
export interface VocabCard {
  id: string
  courseId: string
  level: Level
  term: string // ベトナム語
  meaning: string // 日本語の意味
  exampleSentence?: string
  audioAssetPath?: string
  createdAt: string
}
