// .env.local が未設定(Firebaseプロジェクト未接続)の場合に表示する開発者向け案内。
// README.mdのセットアップ手順を参照。
export function FirebaseSetupNotice() {
  return (
    <main style={{ maxWidth: 560, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Firebase未設定です</h1>
      <p>
        <code>.env.local</code> が見つからないか、必要な値が空です。
        <code>.env.example</code> をコピーして <code>.env.local</code> を作成し、
        Firebaseコンソールで取得した接続情報を入力してください。
      </p>
      <p>詳しい手順は README.md を参照してください。</p>
    </main>
  )
}
