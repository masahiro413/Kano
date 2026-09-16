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
  level: Level
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
