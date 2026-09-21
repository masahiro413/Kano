import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Firestoreセキュリティルール(firestore.rules)の網羅的テスト(TASKS.md Phase 9)。
// ロール(生徒/staff)・所有者境界を越えたアクセスができないことを、
// エミュレータに対する実際のリクエストで検証する。
//
// 事前準備: `firebase emulators:start --only firestore` でエミュレータを起動しておくこと。

const STUDENT_A = 'student-a'
const STUDENT_B = 'student-b'
const STAFF_1 = 'staff-1'

const __dirname = dirname(fileURLToPath(import.meta.url))

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'kano-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  // ルールを無視して基礎データ(生徒2名・staff1名のプロフィール)を投入する。
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users', STUDENT_A), {
      uid: STUDENT_A,
      email: 'a@example.com',
      displayName: 'Student A',
      role: 'student',
      displayLanguage: 'ja',
      approvalStatus: 'approved',
      courseId: 'course1',
      level: 'beginner',
      placementTestCompleted: true,
      evaluationDialect: 'northern',
      createdAt: '2026-01-01T00:00:00Z',
    })
    await setDoc(doc(db, 'users', STUDENT_B), {
      uid: STUDENT_B,
      email: 'b@example.com',
      displayName: 'Student B',
      role: 'student',
      displayLanguage: 'ja',
      approvalStatus: 'approved',
      courseId: 'course1',
      level: 'beginner',
      placementTestCompleted: true,
      evaluationDialect: 'northern',
      createdAt: '2026-01-01T00:00:00Z',
    })
    await setDoc(doc(db, 'users', STAFF_1), {
      uid: STAFF_1,
      email: 'staff@example.com',
      displayName: 'Staff One',
      role: 'staff',
      displayLanguage: 'ja',
      createdAt: '2026-01-01T00:00:00Z',
    })
  })
})

function studentA() {
  return testEnv.authenticatedContext(STUDENT_A).firestore()
}
function studentB() {
  return testEnv.authenticatedContext(STUDENT_B).firestore()
}
function staff() {
  return testEnv.authenticatedContext(STAFF_1).firestore()
}
function anon() {
  return testEnv.unauthenticatedContext().firestore()
}

describe('users/{uid}', () => {
  it('本人は自分のプロフィールを読める', async () => {
    await assertSucceeds(getDoc(doc(studentA(), 'users', STUDENT_A)))
  })

  it('他の生徒は他人のプロフィールを読めない', async () => {
    await assertFails(getDoc(doc(studentB(), 'users', STUDENT_A)))
  })

  it('staffはどの生徒のプロフィールも読める', async () => {
    await assertSucceeds(getDoc(doc(staff(), 'users', STUDENT_A)))
  })

  it('未認証ユーザーは読めない', async () => {
    await assertFails(getDoc(doc(anon(), 'users', STUDENT_A)))
  })

  it('自己登録はrole=student, approvalStatus=pendingでのみ成功する', async () => {
    const newStudent = testEnv.authenticatedContext('new-student').firestore()
    await assertSucceeds(
      setDoc(doc(newStudent, 'users', 'new-student'), {
        uid: 'new-student',
        email: 'x@example.com',
        displayName: 'X',
        role: 'student',
        displayLanguage: 'ja',
        approvalStatus: 'pending',
        courseId: 'course1',
        level: null,
        placementTestCompleted: false,
        evaluationDialect: 'northern',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('自己登録でapprovalStatusをapprovedにして自己承認することはできない', async () => {
    const attacker = testEnv.authenticatedContext('attacker').firestore()
    await assertFails(
      setDoc(doc(attacker, 'users', 'attacker'), {
        uid: 'attacker',
        email: 'attacker@example.com',
        displayName: 'Attacker',
        role: 'student',
        displayLanguage: 'ja',
        approvalStatus: 'approved',
        courseId: 'course1',
        level: null,
        placementTestCompleted: false,
        evaluationDialect: 'northern',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('自己登録でrole=staffとして偽装登録することはできない', async () => {
    const attacker = testEnv.authenticatedContext('attacker').firestore()
    await assertFails(
      setDoc(doc(attacker, 'users', 'attacker'), {
        uid: 'attacker',
        email: 'attacker@example.com',
        displayName: 'Attacker',
        role: 'staff',
        displayLanguage: 'ja',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('本人はlevelなどroleとapprovalStatus以外のフィールドを更新できる(プレースメントテスト等)', async () => {
    await assertSucceeds(
      updateDoc(doc(studentA(), 'users', STUDENT_A), {
        level: 'intermediate',
        placementTestCompleted: true,
      }),
    )
  })

  it('本人は自分のapprovalStatusを書き換えられない(承認済み→拒否への自己変更も含む)', async () => {
    // STUDENT_AはbeforeeachでapprovalStatus='approved'として投入済みのため、
    // 'approved'への書き換えは値として無変更になってしまいテストにならない。
    // 実際に値が変わる書き換え('rejected'への変更)を試みて拒否されることを確認する。
    await assertFails(
      updateDoc(doc(studentA(), 'users', STUDENT_A), { approvalStatus: 'rejected' }),
    )
  })

  it('本人は自分のroleを書き換えてstaffに昇格できない', async () => {
    await assertFails(updateDoc(doc(studentA(), 'users', STUDENT_A), { role: 'staff' }))
  })

  it('他の生徒は他人のプロフィールを更新できない', async () => {
    await assertFails(
      updateDoc(doc(studentB(), 'users', STUDENT_A), { displayName: 'Hacked' }),
    )
  })

  it('staffは生徒のapprovalStatusを承認に変更できる', async () => {
    await assertSucceeds(
      updateDoc(doc(staff(), 'users', STUDENT_A), { approvalStatus: 'approved' }),
    )
  })

  it('staffは新規staffアカウントを作成できる(role=staffでの新規create)', async () => {
    await assertSucceeds(
      setDoc(doc(staff(), 'users', 'new-staff'), {
        uid: 'new-staff',
        email: 'newstaff@example.com',
        displayName: 'New Staff',
        role: 'staff',
        displayLanguage: 'ja',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })
})

describe('tasks/{taskId}', () => {
  it('所有者は自分のタスクを作成・読み書きできる', async () => {
    const db = studentA()
    const ref = doc(db, 'tasks', 'task1')
    await assertSucceeds(
      setDoc(ref, {
        ownerUid: STUDENT_A,
        title: 'test',
        priority: 'medium',
        completed: false,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
    await assertSucceeds(getDoc(ref))
    await assertSucceeds(updateDoc(ref, { completed: true }))
    await assertSucceeds(deleteDoc(ref))
  })

  it('他人のタスクは読めない・書き換えられない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'tasks', 'task1'), {
        ownerUid: STUDENT_A,
        title: 'test',
        priority: 'medium',
        completed: false,
        createdAt: '2026-01-01T00:00:00Z',
      })
    })
    const ref = doc(studentB(), 'tasks', 'task1')
    await assertFails(getDoc(ref))
    await assertFails(updateDoc(ref, { completed: true }))
    await assertFails(deleteDoc(ref))
  })

  it('他人になりすましたownerUidでタスクを作成できない', async () => {
    await assertFails(
      setDoc(doc(studentB(), 'tasks', 'task2'), {
        ownerUid: STUDENT_A,
        title: 'spoofed',
        priority: 'low',
        completed: false,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })
})

describe('courses/{courseId}', () => {
  it('署名済みユーザーは読めるが、staff以外は書き込めない', async () => {
    await assertSucceeds(getDocs(collection(studentA(), 'courses')))
    await assertFails(
      setDoc(doc(studentA(), 'courses', 'c1'), { name: 'x', description: 'y' }),
    )
  })

  it('未認証ユーザーは読めない', async () => {
    await assertFails(getDocs(collection(anon(), 'courses')))
  })

  it('staffは作成・編集できる', async () => {
    await assertSucceeds(
      setDoc(doc(staff(), 'courses', 'c1'), { name: 'x', description: 'y' }),
    )
  })
})

describe('levelChanges/{changeId}', () => {
  it('本人は自分のlevelChangesを作成できる', async () => {
    await assertSucceeds(
      setDoc(doc(studentA(), 'levelChanges', 'lc1'), {
        studentUid: STUDENT_A,
        fromLevel: null,
        toLevel: 'beginner',
        reason: 'placement_test',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('他人になりすましたstudentUidでlevelChangesを作成できない', async () => {
    await assertFails(
      setDoc(doc(studentB(), 'levelChanges', 'lc2'), {
        studentUid: STUDENT_A,
        fromLevel: null,
        toLevel: 'beginner',
        reason: 'placement_test',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('他人のlevelChangesは読めない', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'levelChanges', 'lc1'), {
        studentUid: STUDENT_A,
        fromLevel: null,
        toLevel: 'beginner',
        reason: 'placement_test',
        createdAt: '2026-01-01T00:00:00Z',
      })
    })
    await assertFails(getDoc(doc(studentB(), 'levelChanges', 'lc1')))
    await assertSucceeds(getDoc(doc(staff(), 'levelChanges', 'lc1')))
  })

  it('本人であってもlevelChangesを更新・削除できない(staffのみ)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'levelChanges', 'lc1'), {
        studentUid: STUDENT_A,
        fromLevel: null,
        toLevel: 'beginner',
        reason: 'placement_test',
        createdAt: '2026-01-01T00:00:00Z',
      })
    })
    await assertFails(
      updateDoc(doc(studentA(), 'levelChanges', 'lc1'), { toLevel: 'advanced' }),
    )
    await assertSucceeds(
      updateDoc(doc(staff(), 'levelChanges', 'lc1'), { toLevel: 'advanced' }),
    )
  })
})

describe('answerLogs/{logId}', () => {
  it('本人は自分の解答ログを作成できるが、他人になりすませない', async () => {
    await assertSucceeds(
      setDoc(doc(studentA(), 'answerLogs', 'log1'), {
        studentUid: STUDENT_A,
        questionSetId: 'qs1',
        questionId: 'q1',
        format: 'choice',
        correct: true,
        isPlacementTest: false,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
    await assertFails(
      setDoc(doc(studentB(), 'answerLogs', 'log2'), {
        studentUid: STUDENT_A,
        questionSetId: 'qs1',
        questionId: 'q1',
        format: 'choice',
        correct: true,
        isPlacementTest: false,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('他人の解答ログは読めないが、staffは読める', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'answerLogs', 'log1'), {
        studentUid: STUDENT_A,
        questionSetId: 'qs1',
        questionId: 'q1',
        format: 'choice',
        correct: true,
        isPlacementTest: false,
        createdAt: '2026-01-01T00:00:00Z',
      })
    })
    await assertFails(getDoc(doc(studentB(), 'answerLogs', 'log1')))
    await assertSucceeds(getDoc(doc(staff(), 'answerLogs', 'log1')))
  })

  it('解答ログは誰も更新・削除できない(改ざん防止)', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'answerLogs', 'log1'), {
        studentUid: STUDENT_A,
        questionSetId: 'qs1',
        questionId: 'q1',
        format: 'choice',
        correct: true,
        isPlacementTest: false,
        createdAt: '2026-01-01T00:00:00Z',
      })
    })
    await assertFails(
      updateDoc(doc(studentA(), 'answerLogs', 'log1'), { correct: false }),
    )
    await assertFails(updateDoc(doc(staff(), 'answerLogs', 'log1'), { correct: false }))
    await assertFails(deleteDoc(doc(staff(), 'answerLogs', 'log1')))
  })
})

describe('settings/{settingId}', () => {
  it('署名済みユーザーは読めるが、staff以外は書き込めない', async () => {
    await assertSucceeds(getDoc(doc(studentA(), 'settings', 'levelThresholds')))
    await assertFails(
      setDoc(doc(studentA(), 'settings', 'levelThresholds'), {
        placementAdvancedMin: 100,
      }),
    )
  })

  it('staffは書き込める', async () => {
    await assertSucceeds(
      setDoc(doc(staff(), 'settings', 'levelThresholds'), {
        placementAdvancedMin: 80,
        placementIntermediateMin: 40,
        promotionThreshold: 80,
        demotionThreshold: 40,
        recentQuestionCount: 20,
      }),
    )
  })
})

describe('学習コンテンツ(vocabCards / listeningMaterials / questionSets+questions)', () => {
  it('vocabCardsは署名済みユーザーが読め、staffのみ書き込める', async () => {
    await assertSucceeds(getDocs(collection(studentA(), 'vocabCards')))
    await assertFails(
      setDoc(doc(studentA(), 'vocabCards', 'card1'), { term: 'x', meaning: 'y' }),
    )
    await assertSucceeds(
      setDoc(doc(staff(), 'vocabCards', 'card1'), {
        courseId: 'course1',
        level: 'beginner',
        term: 'Xin chào',
        meaning: 'こんにちは',
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('questionSetsとそのサブコレクションquestionsは署名済みユーザーが読め、staffのみ書き込める', async () => {
    await assertSucceeds(
      setDoc(doc(staff(), 'questionSets', 'set1'), {
        courseId: 'course1',
        level: 'beginner',
        title: 'Set 1',
        isPlacementTest: false,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
    await assertFails(
      setDoc(doc(studentA(), 'questionSets', 'set2'), {
        courseId: 'course1',
        level: 'beginner',
        title: 'Set 2',
        isPlacementTest: false,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )

    await assertSucceeds(
      setDoc(doc(staff(), 'questionSets', 'set1', 'questions', 'q1'), {
        format: 'choice',
        promptText: 'Q1',
        choices: ['a', 'b'],
        correctIndex: 0,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
    await assertSucceeds(
      getDoc(doc(studentA(), 'questionSets', 'set1', 'questions', 'q1')),
    )
    await assertFails(
      updateDoc(doc(studentA(), 'questionSets', 'set1', 'questions', 'q1'), {
        promptText: 'hacked',
      }),
    )
  })
})

describe('vocabReviews/{reviewId}', () => {
  const REVIEW_ID = `${STUDENT_A}_card1`

  it('本人は自分のSRS状態を作成・更新できるが、他人になりすませない', async () => {
    await assertSucceeds(
      setDoc(doc(studentA(), 'vocabReviews', REVIEW_ID), {
        studentUid: STUDENT_A,
        vocabCardId: 'card1',
        due: '2026-01-01T00:00:00Z',
        stability: 1,
        difficulty: 5,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 1,
        lapses: 0,
        state: 1,
        lastReview: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    )
    await assertFails(
      setDoc(doc(studentB(), 'vocabReviews', REVIEW_ID), {
        studentUid: STUDENT_A,
        vocabCardId: 'card1',
        due: '2026-01-01T00:00:00Z',
        stability: 1,
        difficulty: 5,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 1,
        lapses: 0,
        state: 1,
        lastReview: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('他人のSRS状態は読めないが、staffは読める', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'vocabReviews', REVIEW_ID), {
        studentUid: STUDENT_A,
        vocabCardId: 'card1',
        due: '2026-01-01T00:00:00Z',
        stability: 1,
        difficulty: 5,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 1,
        lapses: 0,
        state: 1,
        lastReview: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })
    })
    await assertFails(getDoc(doc(studentB(), 'vocabReviews', REVIEW_ID)))
    await assertSucceeds(getDoc(doc(staff(), 'vocabReviews', REVIEW_ID)))
  })
})

describe('pronunciationApiUsageLogs/{logId}', () => {
  it('本人は自分の利用ログを書き込めるが、他人になりすませない', async () => {
    await assertSucceeds(
      setDoc(doc(studentA(), 'pronunciationApiUsageLogs', 'log1'), {
        studentUid: STUDENT_A,
        durationSeconds: 5,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
    await assertFails(
      setDoc(doc(studentB(), 'pronunciationApiUsageLogs', 'log2'), {
        studentUid: STUDENT_A,
        durationSeconds: 5,
        createdAt: '2026-01-01T00:00:00Z',
      }),
    )
  })

  it('他人の利用ログは読めないが、staffは読める', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'pronunciationApiUsageLogs', 'log1'), {
        studentUid: STUDENT_A,
        durationSeconds: 5,
        createdAt: '2026-01-01T00:00:00Z',
      })
    })
    await assertFails(getDoc(doc(studentB(), 'pronunciationApiUsageLogs', 'log1')))
    await assertSucceeds(getDoc(doc(staff(), 'pronunciationApiUsageLogs', 'log1')))
  })
})

// このテストファイル自体が正しくルールを読み込めていることの健全性チェック。
describe('sanity', () => {
  it('rules-unit-testingがエミュレータに接続できている', () => {
    expect(testEnv.projectId).toBe('kano-rules-test')
  })
})
