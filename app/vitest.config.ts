import { defineConfig } from 'vitest/config'

// Firestoreセキュリティルールのテスト専用設定(Phase 9)。
// アプリ本体のビルド用vite.config.tsとは切り離し、Node環境でエミュレータに
// 接続するだけのシンプルな構成にしている。
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
