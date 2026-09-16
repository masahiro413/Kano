# Kano — フロントエンド

ベトナム語会話スクール向け業務・学習アプリのフロントエンド。仕様は [../SPEC.md](../SPEC.md)、実装タスクは [../TASKS.md](../TASKS.md) を参照。

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` に Firebase コンソール(プロジェクト設定 → 全般 → マイアプリ)で取得した接続情報を入力する。プロジェクトがまだ無い場合は [Firebase console](https://console.firebase.google.com/) で新規作成し、Authentication(メール/パスワード)・Firestore・Storage・Hosting を有効化する。

## 開発

```bash
npm run dev          # 開発サーバー起動
npm run typecheck    # 型チェック
npm run lint         # ESLint
npm run format       # Prettierで整形
npm run build         # 本番ビルド
```

## Firestoreルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

`firestore.rules` は初版ドラフト(TASKS.md Phase 0)。コンテンツ系コレクション追加時やPhase 9のテストで随時更新する。

## ディレクトリ構成

```
src/
  components/  # 共通UIコンポーネント・ルートガード
  contexts/    # AuthContextなど
  i18n/        # 日本語/ベトナム語の翻訳リソース
  lib/         # Firebase初期化など外部連携
  pages/       # ルーティング対象のページコンポーネント
  types/       # Firestoreドキュメントの型定義
```
