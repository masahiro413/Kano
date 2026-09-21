# TASKS.md — 実装計画

SPEC.md の内容を実装可能な単位に分解したタスクリスト。フェーズ順に進めることを推奨する(後続フェーズは前フェーズの成果に依存)。

---

## Phase 0: 基盤整備

- [ ] Firebaseプロジェクト作成(Authentication / Firestore / Storage / Hosting を有効化)— **未着手。`app/.env.example`を参照し実際のプロジェクトを作成・接続する必要がある**
- [x] フロントエンド雛形構築(React + TypeScript + Vite)— `app/`に構築済み
- [x] ルーティング設計(生徒/staffで表示を分岐するルート構成)— 基本構造のみ。承認待ち・staff専用エリアのガードも実装済み(`app/src/App.tsx`, `app/src/components/guards/`)
- [x] i18n基盤導入(日本語/ベトナム語切り替え。react-i18next等)— 基本語彙のみ登録済み、画面追加時に随時拡充する
- [x] レスポンシブレイアウトの基本方針・ブレークポイント設計 — SPEC.md §7に明文化。MUIデフォルトのブレークポイントをそのまま採用し、320px/375pxで横スクロールが出ないことを確認する方針とした。Phase 9で発見した2件の実バグ(ナビゲーション・問題編集フォームの横はみ出し)もこの方針に沿って修正済み
- [x] Firestoreデータモデル設計(コレクション構造の確定。SPEC §6.2をベースに詳細化)— users/tasks/courses/levelChanges/pronunciationApiUsageLogsに加え、Phase 3で問題集・単語帳・リスニング教材(questionSets/vocabCards/listeningMaterials)の型も`app/src/types/firestore.ts`に定義済み
- [x] Firestoreセキュリティルールの初版作成(ロール・所有者ベースのアクセス制御)— `app/firestore.rules`に初版ドラフトあり。コンテンツ系コレクション追加時・Phase 9で拡充する
- [x] CI/Lint/Format設定(将来の引き継ぎを見据えた最低限の品質担保)— ESLint + Prettier導入済み(`npm run lint` / `npm run format`)。GitHub Actions等のCIパイプライン自体は未構築

## Phase 1: 認証・生徒登録・承認フロー

- [x] Firebase Authentication(Email/Password)組み込み — `app/src/lib/firebaseAuth.ts`
- [x] 生徒向け登録フォーム実装(氏名・メール・パスワード・連絡先・コース選択・表示言語初期設定)— `app/src/pages/auth/RegisterPage.tsx`。コース一覧はFirestoreの`courses`コレクションから取得するため、CMS実装(Phase 3)までは手動でコースを投入する必要がある
- [x] 登録直後の「承認待ち」状態の実装(ログイン可・機能利用不可の専用画面)— `PendingApprovalPage.tsx` + `RequireStudentApproved`ガード
- [x] staff向け「承認待ち一覧」画面 + 承認/拒否ボタン — `ApprovalQueuePage.tsx`
- [x] 承認後にプレースメントテストへ誘導する導線 — `RequirePlacementTest`ガード。テスト本体はPhase 4で実装
- [x] パスワードリセットフロー(Firebase標準機能の組み込み)— `ForgotPasswordPage.tsx`
- [x] staffアカウント管理画面の実装(既存staffがメール+仮パスワードで新規staffを作成 — SPEC §2.3)— `CreateStaffAccountPage.tsx`。セカンダリFirebase Appインスタンスで実行者のセッションを維持する方式
- [ ] **実機での動作確認は未実施**。Firebaseプロジェクトが未接続のため、UIの描画確認(ダミー環境変数)のみPlaywrightで実施した。実際のプロジェクト接続後、登録→承認→ログインの一連のフローを必ず確認すること
- [ ] Firestoreセキュリティルールのフィールド単位の制御(生徒がrole/approvalStatus/levelを自分で書き換えられないようにする等)— 現状は粗い粒度のルールのみ(`app/firestore.rules`)。Phase 9で詳細化・テストする

## Phase 2: タスク管理機能

- [x] タスクのFirestoreスキーマ確定(タイトル・優先度・完了フラグ・所有者ID)— `app/src/types/firestore.ts`のTask型(Phase 0で定義済み)
- [x] タスク追加/一覧表示UI — `app/src/pages/tasks/TasksPage.tsx`
- [x] タスク完了トグルUI — チェックボックスで即時更新
- [x] タスク削除UI(確認ダイアログ含む)— MUI Dialogで確認後に削除
- [x] 優先度によるソート/フィルタ — フィルタ(すべて/高/中/低)と優先度順ソートの切り替えボタン
- [ ] **ユーザーごとのデータ分離をセキュリティルールでテスト**— 未実施。`app/firestore.rules`のtasksルール(ownerUid一致のみread/write可)は実装済みだが、実機での検証はPhase 9でまとめて行う
- [ ] **実機での動作確認は未実施**。Firebase未接続のため、Playwrightで空状態・入力欄・優先度セレクトのレイアウトのみ確認した。実際の追加→完了→削除の一連の動作は接続後に確認が必要
- 補足: `where(ownerUid==).orderBy(createdAt)`のクエリ用に複合インデックスを`app/firestore.indexes.json`に追加済み。`firebase deploy --only firestore:indexes`が必要

## Phase 3: 学習コンテンツ管理(CMS/管理画面)

- [x] コース・レベルのマスタデータ設計(コース一覧、レベル定義)— `Course`型はPhase 0で定義済み。管理UIを`CoursesManagementPage.tsx`として実装。レベルは`Level`型(既存)を共通コンポーネント`CourseLevelSelect.tsx`でコース選択とセットにして各コンテンツ編集フォームに組み込んだ
- [x] 問題集の作成/編集UI — `QuestionSetsManagementPage.tsx`(`questionSets/{setId}`)。`isPlacementTest`フラグでプレースメントテスト用の問題集も同じ型で表現する(SPEC §4.2.2)
- [x] 文法問題・会話文問題の作成/編集UI(選択式・記述式・並び替え・誤り指摘・発音・ロールプレイの6形式)— `QuestionEditorDialog.tsx`。SPEC §4.1.1/§4.1.2で列挙された8+の出題形式は、この6つの回答形式(format)+任意の`listeningMaterialId`(リスニング教材参照)+`dialogueTurns`(会話文の文脈)の組み合わせとして表現する設計とした。`questionSets/{setId}/questions/{questionId}`サブコレクションに保存(`lib/questions.ts`, `hooks/useQuestions.ts`, `types/firestore.ts`の`Question`判別共用体)
- [x] 単語帳の作成/編集UI — `VocabCardsManagementPage.tsx`(`vocabCards/{cardId}`)。SRSの復習スケジューリング自体はPhase 6で実装する
- [x] リスニング教材の音声アップロード機能(Firebase Storage連携)— `ListeningMaterialsManagementPage.tsx`。`listening-materials/`パスにアップロードし、`listeningMaterials/{materialId}`にメタデータを保存
- [ ] **TTSによる音声自動生成機能は未実装(アーキテクチャ上の課題として保留)**。Azure/Google Cloud TTSはAPIキーを要するが、本アプリはFirebaseのみで自前サーバーを持たない構成(CLAUDE.md)のため、クライアントに秘密鍵を置く実装は行わなかった。Cloud FunctionsなどFirebase側のサーバーレス機能を介した実装が必要— 着手前にユーザーに実装方針を確認すること
- [x] コース×レベルによる公開範囲タグ付けUI — 問題集・単語帳・リスニング教材の各編集フォームに`CourseLevelSelect`として共通実装
- [ ] コンテンツ一覧・検索・フィルタ画面(staff向け)— 各コンテンツ種別ごとの単純な一覧UIまでは実装したが、横断検索・絞り込みは未実装。スコープ外と判断(現時点でコンテンツ量が少なく必要性が低いため)。データ量が増えた段階で再検討する
- [ ] **実機での動作確認は未実施**。Firebase未接続のため、Playwrightでレイアウト・問題編集フォームのformat切り替え(選択式/ロールプレイ)の描画のみ確認した。実際のFirestore/Storageへの保存・読み込みは接続後に確認が必要
- [ ] `questionSets`/`vocabCards`/`listeningMaterials`/`questionSets/{id}/questions`のFirestoreセキュリティルールは`courses`と同じ方針(read: 承認済みユーザー、write: staffのみ)で追加済み。Phase 9で網羅的にテストする

## Phase 4: プレースメントテスト & レベル判定ロジック

- [ ] プレースメントテストの出題内容作成: 選択式・文法・リスニング・発音を含む20〜30問(SPEC §4.2.2)— これは開発タスクではなくコンテンツ入力作業。Phase 3で実装済みのCMS(`isPlacementTest`フラグ付き問題集)を使ってstaffが実際に投入する必要がある。現時点ではテストデータが存在しないため`PlacementTestPage`は「まだ準備されていません」という案内を表示する
- [x] プレースメントテスト受験フロー実装 — `PlacementTestPage.tsx`。**発音・ロールプレイ形式の問題はAzure Pronunciation Assessment連携が未実装のため採点対象外(分母に含めない)とし、UIには「準備中」の案内のみ表示する**(Phase 7で対応。ユーザー承認済みの方針、SPEC §8参照)。選択式・記述式・並び替え・誤り指摘の4形式は`QuestionAnswerInput`コンポーネントで解答→自動採点まで動作する
- [x] プレースメントテスト結果からの初期レベル自動判定(正答率の固定閾値、staffが調整可能な設定値)— `lib/levelEvaluation.ts`の`determineInitialLevel`。閾値は`lib/levelSettings.ts`(Firestore `settings/levelThresholds`)から取得し、未設定時はSPEC記載の例値(80%/40%)をデフォルトとする
- [x] レベル自動昇降級ロジックの実装: 直近N問の正答率+ヒステリシス — `lib/levelEvaluation.ts`の`evaluatePromotionDemotion`として純粋関数を実装済み。**ただしこの関数はまだどこからも呼び出されていない**。直近の解答履歴(`answerLogs`)は通常の問題演習(Phase 5、未実装)を通じて蓄積される想定のため、Phase 5で演習UIを実装する際にこの関数を呼び出す配線を行うこと
- [x] 閾値(昇級ライン・降級ライン・N値)をstaffが管理画面から調整できる設定項目として実装 — `LevelSettingsPage.tsx`(`/staff/level-settings`)。プレースメントテスト用の閾値も同じ画面で一元管理する
- [x] レベル変更の履歴記録 — `levelChanges/{changeId}`にプレースメントテスト提出時に記録(`lib/placementTest.ts`)。自前サーバーを持たない構成のため、判定・書き込みは生徒本人のブラウザから直接行う(Firestoreルールで本人のstudentUidでのcreateのみ許可、update/deleteはstaff限定)。履歴の閲覧UIはPhase 8(進捗ダッシュボード)で実装する
- [ ] **実機での動作確認は未実施**。Firebase未接続のため、Playwrightで`LevelSettingsPage`のレイアウトと、`QuestionAnswerInput`の3形式(選択式・並び替え・誤り指摘)の解答UIが正しく動作すること(並び替えで正しい順序を組み立てられる等)のみ確認した。実際のプレースメントテスト受験(Firestoreへの書き込み・レベル反映・`RequirePlacementTest`ガード解除)は接続後に確認が必要

## Phase 5: 学習機能 — 問題演習

- [x] 選択式問題の出題・採点UI — `QuestionAnswerInput.tsx`(Phase 4で先行実装済み、Phase 5でLearningHomePage/QuestionSetPracticePageから利用する形に配線)
- [x] 穴埋め・記述式問題の出題・採点UI — 同上。複数正解パターンの照合は`lib/questionScoring.ts`の`isAnswerCorrect`(前後・連続空白と大小文字を許容した完全一致判定、SPEC §4.1.3)
- [x] リスニング問題の出題UI(音声再生 + 回答フォーム)— `QuestionContext.tsx`。`listeningMaterialId`が設定された問題の上部に音声プレイヤーを表示する。回答フォーム自体は他形式と共通の`QuestionAnswerInput`を使う
- [x] 並び替え問題の出題UI — ドラッグ&ドロップではなく、シャッフルされたピースをクリックした順に並べる方式で実装(`QuestionAnswerInput.tsx`)。ライブラリ追加を避けクリック操作のみで完結させた
- [x] 誤り指摘問題の出題UI(文中のセグメントを選択させる)— `QuestionAnswerInput.tsx`
- [x] 文変換・翻訳問題の出題UI + 複数正解パターンとの照合ロジック(SPEC §4.1.3)— 新形式は追加せず、既存の`free_text`形式(複数の`acceptedAnswers`)をそのまま使う設計とした(SPEC §4.1.3の通り)
- [x] 会話文の内容理解問題の出題UI(対話再生/表示 + 要約・詳細質問)— `QuestionContext.tsx`が`dialogueTurns`を吹き出し風に表示し、その下に`choice`/`free_text`形式で質問に答える構成。新形式は追加せず既存形式の組み合わせで表現
- [ ] ロールプレイ問題の出題UI(対話ターンの進行管理 + Azure Pronunciation Assessment連携 — Phase 7と連携)。既存の固定ターン台本型に加え、**Anam AIアバターとの自由会話モード**(SPEC §4.1.2-a)を導入する方針が示されている。実装前にSPEC §8-11の未決事項(既存方式との併存可否、セッショントークン発行基盤、ベトナム語方言対応の声の有無、料金)をユーザーに確認すること。現状`QuestionAnswerInput`は「準備中」の案内のみ表示し採点対象外(Phase 4と同じ方針)
- [x] 問題演習結果の記録(正答率、履歴)— `lib/questionPractice.ts`の`submitQuestionPractice`。`answerLogs`に解答履歴を記録したうえで、直近N問(`LevelThresholdSettings.recentQuestionCount`)を再取得し`evaluatePromotionDemotion`(Phase 4で実装済み・未配線だった関数)を呼び出して自動昇降級を判定・反映する配線をここで行った
- [x] `LearningHomePage`を「生徒のコース×レベルに一致する非プレースメント問題集の一覧」画面として実装し、`QuestionSetPracticePage`(`/learning/questions/:setId`)への導線とした
- [ ] **実機での動作確認は未実施**。Firebase未接続のため、Playwrightで`QuestionAnswerInput`+`QuestionContext`の組み合わせ(選択式+会話文脈、記述式)と`LearningHomePage`の空状態表示のみ確認した。実際の演習提出→解答履歴記録→自動昇降級判定の一連の動作は接続後に確認が必要

## Phase 6: 学習機能 — 単語帳(SRS)

- [x] SRSライブラリ(ts-fsrs等)の選定・導入 — SPEC §4.1の通り`ts-fsrs`(FSRSアルゴリズムの実装)を導入。`lib/srs.ts`がライブラリのCard型とFirestore保存用の`VocabReview`型(`types/firestore.ts`)を相互変換する薄いラッパー
- [x] 単語帳の出題スケジューリングロジック — `lib/srs.ts`の`isDue`(未学習または復習予定日を過ぎたカードを対象とする)と`computeNextReview`(評価から次回復習日時を算出)。`vocabReviews/{studentUid}_{vocabCardId}`に生徒×カードごとのSRS状態を保存(`lib/vocabReviews.ts`)
- [x] 単語帳の学習UI(表/裏カード形式など)— `VocabPracticePage.tsx`。表(用語)→「答えを見る」→裏(意味・例文)→もう一度/難しい/普通/簡単の4段階評価、という一般的なSRSフラッシュカードUIを実装。出題キューはセッション開始時に1回だけ確定させ(`VocabPracticeSession`)、復習記録による購読データの更新で出題中のカードが入れ替わらないようにした
- [ ] 習熟度の記録・可視化 — 復習状態(`vocabReviews`)自体はts-fsrsのstability/difficulty/repsなどのフィールドとして記録済みだが、それを可視化するUIはまだない。Phase 8(進捗ダッシュボード)で対応する
- [x] `LearningHomePage`に単語帳への導線を追加
- [ ] **実機での動作確認は未実施**。Firebase未接続のため、`VocabPracticeSession`にモックデータを渡してPlaywrightで表→裏のカード反転UIの描画のみ確認した。ts-fsrsライブラリ自体のAPI呼び出し(`createEmptyCard`/`fsrs().next()`)はNode上で直接動作確認し、期待通りdue日時・stability等が計算されることを確認済み。実際のFirestoreへの書き込み・出題キューの継続的な動作は接続後に確認が必要
- [ ] `vocabReviews`のFirestoreセキュリティルールを追加済み(本人のstudentUidでのcreate/updateのみ許可)。Phase 9で網羅的にテストする

## Phase 7: 学習機能 — 発音練習

### 7.1 基本実装(Azure素点)
- [ ] **Azure AI Speech SDK連携は未着手(ユーザー承認済みの方針でUIのみ先行実装)**。Azureの購読キーはクライアントに直接置けず(TTS自動生成・Anamと同じ理由)、Cloud Functions等のサーバーレス関数でトークンを発行する実装が必要。このプロジェクトはこれまで自前サーバーを一切持たない構成で進めてきたため、Cloud Functions導入は大きな決断であり、着手前に改めてユーザーに確認すること。`lib/pronunciationAssessment.ts`に将来の呼び出し口(`assessPronunciation`)を用意済みだが、現状は呼び出すと例外を投げるだけ
- [x] マイク録音UI(ブラウザ音声入力)— `components/PronunciationRecorder.tsx`。`MediaRecorder`/`getUserMedia`で録音→停止→ブラウザ内再生確認までを実装(録音データはどこにも送信・保存しない)。`QuestionAnswerInput`の`pronunciation`形式に組み込み、問題演習・プレースメントテストの両方で発音問題が表示された際に使える
- [ ] 発音採点結果の表示(正確性・流暢さ・完全性のスコア表示)— Azure連携が前提のため未着手。UIには代わりに「自動採点機能は準備中」の案内を表示している
- [ ] 発音履歴の記録 — 実際のAzureスコアが存在しないため、実データを持たない履歴を作ることは避けた(捏造データを残さない方針)。Azure連携実装後に着手する
- [x] APIコスト・利用回数のモニタリング機構の一元化ポイントのみ先行実装 — `lib/pronunciationAssessment.ts`を将来の唯一の呼び出し口として用意(CLAUDE.mdの「呼び出し箇所は一箇所にまとめておく」方針)。実際のログ記録・制限ロジックはAzure連携実装時に追加する
- [ ] **実機での動作確認**: Playwrightで実際のブラウザのMediaRecorder API(`--use-fake-device-for-media-stream`)を使い、録音開始→停止→再生UIの一連の流れが正しく動作することを確認済み(フェイクデバイスのため無音・0秒扱いだが、状態遷移とUI表示は検証できた)

### 7.2 南部(サイゴン)方言許容ロジック(SPEC §4.5)
- [ ] 語頭子音の南部方言許容ルール(s-→[s-]、v-/d-/gi-→[j-])を、優先一次資料(SPEC §4.5.4-c、Hà Nội⇔Sài Gòn直接比較)から構造化データ化する
- [ ] 韻母(母音+末子音)の南部方言許容ルールテーブルを、ユーザー提供資料「Vần mẫu tiếng Hà Nội」(付録4・表1)と「Vần mẫu tiếng Sài Gòn」(付録4・表2)をセル単位で突き合わせてデジタル化・構造化データ化する(SPEC §4.5.4-b)。**写真からの読み取りではなく原資料を直接参照し、ユーザーまたは南部方言話者の確認を経て確定させること**。§4.5.4-cに記載の個別現象(介音/w/脱落、-ênh/-êm/-êp系の変化、語末子音の合流など)と矛盾しないか照合し、矛盾時は§4.5.4-cを優先する(SPEC §8-9)
- [ ] 語頭子音・介音の南部方言許容ルールテーブルを、ユーザー提供資料「Bảng đối chiếu âm đầu và âm đệm」(付録3・30頁、SPEC §4.5.4-a)からデジタル化・構造化データ化する。§4.5.4-cと矛盾する項目は§4.5.4-cを優先する
- [ ] 上記表中の「*」印の凡例をユーザーに確認する(SPEC §8-6a)
- [x] 語頭子音対照表のtr-/r-の扱い → 解消済み(活字組版の資料により、tr-=/ʈ-/, r-=/ʐ-/が標準音素で北部方言が統合すると確認。SPEC §8-6b, §4.5.4-a)
- [ ] 声調(トーン)の南部方言許容ルールを実装する: 南部方言モードではngã/hỏiを相互許容し、a/à/á/ạは通常通り採点する(SPEC §4.5.4-d、§8-6。核心パターンは取得済み、Azureスコアとの具体的な照合方法は要検証)
- [ ] Azureの内部基準発音が「Vần mẫu tiếng Hà Nội」表と一致する保証はない旨を踏まえ、実装後に北部方言話者の発音でも誤判定が出ないか検証する
- [ ] Azureの音素差分結果に対し、許容ルールテーブルを参照して減点を補正する後処理レイヤーを実装する
- [ ] 生徒プロフィールに「評価対象方言(北部標準/南部サイゴン)」の設定項目を追加する
- [ ] 講師ダッシュボードに「Azure素点」と「方言補正後スコア」を両方表示する
- [ ] 南部方言ネイティブ話者による実音声レビュー・ルールテーブルの精度調整(SPEC §4.5.5)

### 7.3 リスニング教材の方言別音声(SPEC §4.6)
- [ ] FPT.AIの正式見積もり取得・料金確定(SPEC §8-7)
- [ ] 採用が決まった場合、FPT.AI TTS APIの連携実装(北部/中部/南部の音声選択)

## Phase 8: 進捗ダッシュボード

- [x] 生徒個人向け:自分の学習履歴・スコア推移画面 — `StudentDashboardPage.tsx`("/"のホーム画面)。全体正答率・出題形式別正答率・直近10件の解答結果(○×表示)・単語帳の学習状況(学習済み枚数/本日の復習対象)・レベル変更履歴を表示する
- [x] staff向け:全生徒の進捗一覧ダッシュボード — `StaffDashboardPage.tsx`("/"のホーム画面)。承認済み生徒ごとに氏名・コース・レベル・解答数・正答率・単語帳の学習状況を一覧表示する
- [x] 集計ロジック(正答率などの算出)— `lib/progressStats.ts`に`computeAccuracy`/`groupAccuracyByFormat`/`groupLogsByStudent`/`computeVocabStats`/`formatDate`を実装。**発音スコアの平均算出は対象外**(Phase 7.1でAzure連携自体を見送ったため、集計すべき実データが存在しない。捏造データを表示しない方針は他フェーズと同様)
- [x] `answerLogs`/`levelChanges`ともに、生徒本人のクエリ用複合インデックス(`studentUid ASC, createdAt DESC`)を追加
- [ ] **実機での動作確認は未実施**。Firebase未接続のため、Playwrightで(a)未ログイン状態での空表示(クラッシュしないこと)と、(b)モックデータを`lib/progressStats.ts`の実関数に通した計算結果(正答率・出題形式別内訳・単語帳学習状況・レベル変更履歴の日付表示)が期待通りであることを確認した。実際のFirestoreデータでの表示は接続後に確認が必要

## Phase 9: 仕上げ・QA

- [x] Firestoreセキュリティルールの網羅的テスト(ロール越境アクセスができないことの確認)— `tests/firestore.rules.test.ts`(`@firebase/rules-unit-testing` + vitest + Firestoreエミュレータ)で35件のテストを実装し全件成功を確認済み。`users`/`tasks`/`courses`/`levelChanges`/`answerLogs`/`settings`/`pronunciationApiUsageLogs`/`vocabCards`/`listeningMaterials`/`questionSets`(+`questions`サブコレクション)/`vocabReviews`の全コレクションについて、所有者境界・ロール境界・改ざん防止(update/delete不可なコレクション)をカバーした。
  - **実装中に実際のセキュリティ上の穴を発見・修正した**: `users/{uid}`は元々「本人は自分のドキュメントを自由に読み書きできる」というルールだったため、生徒が自分自身の`role`を`'staff'`に書き換えて権限昇格したり、`approvalStatus`を`'approved'`に書き換えて自己承認したりできてしまう欠陥があった(CLAUDE.mdの承認制の要件に反する)。`role`/`approvalStatus`が変化しない更新のみ本人に許可し、それ以外(`level`等、本人のブラウザから直接書き込む必要があるフィールド)は引き続き許可する形に修正した。
  - 修正の過程で、Firestoreルールの既知の挙動(`get()`で存在しないドキュメントの`.data`にアクセスすると評価エラーになる)にも遭遇し、`isStaff()`に`exists()`ガードを追加して恒久対応した。
  - 実行方法: `npm run emulators`でエミュレータを起動した状態で別ターミナルから`FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:rules`
- [x] レスポンシブ対応の全画面確認(PC/スマホ)— Playwrightで主要画面を375px/320px幅で確認。**2件の実バグを発見・修正した**: (1) `AppLayout`のナビゲーションが特にstaffロールで項目数が多い場合にモバイル幅で画面外にはみ出す(横スクロールが発生する)問題 → `Stack`に`flexWrap: 'wrap'`を追加して修正。(2) `QuestionEditorDialog`の会話文脈・ロールプレイ発言の入力行(話者+発言内容+チェックボックス+削除ボタン)が、モバイル幅では「話者」ラベルが途中で切れ「生徒が発話する」チェックボックスのラベルが1文字ずつ縦に折り返される問題 → `direction={{ xs: 'column', sm: 'row' }}`に変更して解決
- [x] i18n完全対応の確認(日本語/ベトナム語で全画面を確認)— 静的解析でja.json/vi.jsonの全キーを比較し、両ファイルとも174キーで完全一致(片方にしかないキーはゼロ)であることを確認した。コード内で使用されている`t()`呼び出しのキー(動的キー`staff.levels.*`/`staff.questions.formats.*`/`tasks.priority.*`を含む)もすべて両ファイルに存在することを確認済み。実際のブラウザでの全画面目視確認(文字送りの崩れ等)は未実施
- [ ] 主要ユーザーフローのE2E確認(生徒登録→承認→プレースメントテスト→学習、タスク管理一連の操作)— **実Firebaseプロジェクトが必要なため未実施**。Firestoreエミュレータ上でのE2E確認は今回のスコープ外としたが、`tests/`ディレクトリとエミュレータ環境は整っているため、今後追加しやすい
- [ ] 外部APIコスト実測とレート制限要否の最終判断 — **実施不可**。Azure/Anam等の外部API連携自体が未着手(Phase 7.1、SPEC §8参照)のため、実測対象のAPI呼び出しが存在しない

---

## 依存関係の要点
- Phase 1(認証・承認)が完了しないと、Phase 4以降の生徒向け機能はテストできない。
- Phase 3(コンテンツ管理)がないと、Phase 5〜7の学習機能は表示するコンテンツが存在しない。
- Phase 4(プレースメントテスト・レベル判定)はPhase 3のコース/レベルマスタに依存する。プレースメントテストは発音問題を含むため本来はPhase 7.1(Azure Pronunciation Assessment連携)の一部を先行実装する必要があるが、実装時のユーザー判断により、発音・ロールプレイ形式を採点対象外として除外する形でPhase 7.1を待たずに受験フロー自体は実装済み。Phase 7.1実装後、発音問題も採点対象に含めるよう`lib/questionScoring.ts`の`isScorable`を拡張する必要がある。
- ~~Phase 4で実装したレベル自動昇降級ロジック(`lib/levelEvaluation.ts`の`evaluatePromotionDemotion`)は、Phase 5(問題演習UI)が解答履歴(`answerLogs`)を蓄積するようになって初めて実際に機能する。~~ → **解消済み**。Phase 5で`lib/questionPractice.ts`の`submitQuestionPractice`から呼び出す配線を実装した。
