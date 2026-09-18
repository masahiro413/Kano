# TASKS.md — 実装計画

SPEC.md の内容を実装可能な単位に分解したタスクリスト。フェーズ順に進めることを推奨する(後続フェーズは前フェーズの成果に依存)。

---

## Phase 0: 基盤整備

- [ ] Firebaseプロジェクト作成(Authentication / Firestore / Storage / Hosting を有効化)— **未着手。`app/.env.example`を参照し実際のプロジェクトを作成・接続する必要がある**
- [x] フロントエンド雛形構築(React + TypeScript + Vite)— `app/`に構築済み
- [x] ルーティング設計(生徒/staffで表示を分岐するルート構成)— 基本構造のみ。承認待ち・staff専用エリアのガードも実装済み(`app/src/App.tsx`, `app/src/components/guards/`)
- [x] i18n基盤導入(日本語/ベトナム語切り替え。react-i18next等)— 基本語彙のみ登録済み、画面追加時に随時拡充する
- [ ] レスポンシブレイアウトの基本方針・ブレークポイント設計 — MUIのデフォルトに依存している状態。明示的な方針は未検討
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

- [ ] プレースメントテストの出題内容作成: 選択式・文法・リスニング・発音を含む20〜30問(SPEC §4.2.2)
- [ ] プレースメントテスト受験フロー実装(発音問題を含むためAzure Pronunciation Assessment連携が前提 — Phase 7と依存関係あり)
- [ ] プレースメントテスト結果からの初期レベル自動判定(正答率の固定閾値、staffが調整可能な設定値 — SPEC §4.2.2)
- [ ] レベル自動昇降級ロジックの実装: 直近N問の正答率+ヒステリシス(昇級/降級ラインの間の安定ゾーン)— SPEC §4.2.1
- [ ] 閾値(昇級ライン・降級ライン・N値)をstaffが管理画面から調整できる設定項目として実装
- [ ] レベル変更の履歴記録

## Phase 5: 学習機能 — 問題演習

- [ ] 選択式問題の出題・採点UI
- [ ] 穴埋め・記述式問題の出題・採点UI
- [ ] リスニング問題の出題UI(音声再生 + 回答フォーム)
- [ ] 並び替え問題の出題UI(ドラッグ&ドロップ等でピースを並べる)
- [ ] 誤り指摘問題の出題UI(文中のセグメントを選択させる)
- [ ] 文変換・翻訳問題の出題UI + 複数正解パターンとの照合ロジック(SPEC §4.1.3)
- [ ] 会話文の内容理解問題の出題UI(対話再生/表示 + 要約・詳細質問)
- [ ] ロールプレイ問題の出題UI(対話ターンの進行管理 + Azure Pronunciation Assessment連携 — Phase 7と連携)
- [ ] 問題演習結果の記録(正答率、履歴)

## Phase 6: 学習機能 — 単語帳(SRS)

- [ ] SRSライブラリ(ts-fsrs等)の選定・導入 — SPEC §4.1
- [ ] 単語帳の出題スケジューリングロジック
- [ ] 単語帳の学習UI(表/裏カード形式など)
- [ ] 習熟度の記録・可視化

## Phase 7: 学習機能 — 発音練習

### 7.1 基本実装(Azure素点)
- [ ] Azure AI Speech SDK連携(Pronunciation Assessment、`Granularity: Phoneme`で音素単位の差分を取得)
- [ ] マイク録音UI(ブラウザ音声入力)
- [ ] 発音採点結果の表示(正確性・流暢さ・完全性のスコア表示)
- [ ] 発音履歴の記録
- [ ] APIコスト・利用回数のモニタリング機構(制限は実装しないが、呼び出し箇所を一元化しFirestoreにログを残す — SPEC §4.5)

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

- [ ] 生徒個人向け:自分の学習履歴・スコア推移画面
- [ ] staff向け:全生徒の進捗一覧ダッシュボード
- [ ] 集計ロジック(正答率、発音スコア平均などの算出)

## Phase 9: 仕上げ・QA

- [ ] レスポンシブ対応の全画面確認(PC/スマホ)
- [ ] i18n完全対応の確認(日本語/ベトナム語で全画面を確認)
- [ ] Firestoreセキュリティルールの網羅的テスト(ロール越境アクセスができないことの確認)
- [ ] 主要ユーザーフローのE2E確認(生徒登録→承認→プレースメントテスト→学習、タスク管理一連の操作)
- [ ] 外部APIコスト実測とレート制限要否の最終判断

---

## 依存関係の要点
- Phase 1(認証・承認)が完了しないと、Phase 4以降の生徒向け機能はテストできない。
- Phase 3(コンテンツ管理)がないと、Phase 5〜7の学習機能は表示するコンテンツが存在しない。
- Phase 4(プレースメントテスト・レベル判定)はPhase 3のコース/レベルマスタに依存する。プレースメントテストは発音問題を含むため、Phase 7.1(Azure Pronunciation Assessment連携)の一部を先行実装する必要がある。
