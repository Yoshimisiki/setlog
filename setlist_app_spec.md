# SETLOG 開発仕様書
## v2.9 改訂版（トップページコピー実装済み・PWA・spec最新化）

**アプリ名**: SETLOG — Setlist maker for live musicians
**開発者**: よをふる合同会社 / Yowofuru LLC
**URL**: https://setlog.yowofuru.com
**ステータス**: 公開済み

---

## 概要
SETLOGは、バンドマンが持ち曲から思いがけないセトリを作り、公開URLやSNS用画像まで作れるセトリ作成ツール。
バンド名と持ち時間を入れて、曲・MC・SEを秒数込みで並べると、残り時間に合う曲を自動生成できる。
自動生成曲は何度でも入れ替え可能で、気に入った曲だけ固定できる。
終演後のセトリ画像は、アー写・フライヤー・ロゴ・フォントを使って作成でき、Canva等を開く手間を減らす。
公開したセトリには Spotify・Apple Music・YouTube Music・Deezer の検索リンクを自動表示する。
アカウント不要・無料。

## 現状
ステータス: 公開済み v2.9

### 本番サイト（2026-06-17 時点）
確認URL: https://setlog.yowofuru.com/

トップページは v2.9 コピーに更新済み。

- H1: セトリ作りを、もっと楽しく。
- サブコピー: バンド名と持ち時間を入れるだけ。… 終演後のセトリ画像も…
- バッジ: 登録不要・無料
- CTA: セトリを作る →
- 機能セクション見出し: 持ち曲から、思いがけないセトリを作る。
- 機能カード: 自動生成 / 固定 / MC・SE管理 / セトリ画像作成（2×2）
- ストリーミング説明: 検索リンクを自動表示
- ホーム画面追加案内カード
- 下部CTAセクション: 削除済み（不要と判断）

## 次TODO
- [ ] youtube_url → youtube_id へのデータ移行（URLハッシュ短縮）
- [ ] Google AdSense 申請・審査通過・組み込み
- [ ] バンドマンへのテスト使用・フィードバック収集
- [ ] iPhone Safari 実機で /editor?showA2HS=1 の表示確認
- [ ] ホーム画面追加時アイコン・名前・start_url の実機確認
- [x] 【トップページ】現行旧コピーを新コピーへ差し替え（v2.9）
- [x] 【PWA】iPhoneホーム画面追加案内・manifest・apple-touch-icon設定を実装
- [x] 【iPhone確認】曲リスト右側の操作ボタン（固定する/編集/削除）がhover依存で見えない問題を修正
- [x] 【iPhone確認】自動生成/固定/MC/SEラベルが長い曲名を圧迫しないよう調整
- [x] 【iPhone確認】追加ボタン行・自動生成曲クリアボタンの横はみ出しを修正

### デバッグ項目（優先度：高）
- [x] 画像カスタマイザーのロゴ/QR/テキスト操作 → pointer capture対応でドラッグ/リサイズ操作を安定化
- [x] セトリ自動生成ボタンが画面に表示されない → 3ステップ導線・バンド名入力欄・CTAとして再配置
- [x] 自動生成の再実行 → 手動項目を固定し、自動生成曲だけを入れ替える仕様に変更
- [x] 同名曲の重複 → 曲名正規化で Live / Remaster / Version 違いを重複除外
- [x] 生成曲のUI表示 → 自動生成/固定/MC/SEラベル、固定するボタン、自動生成曲クリアを追加
- [x] iPhoneでキーボードが検索窓と被る → visualViewport APIでキーボード高さ検知・スワイプで閉じる
- [x] 検索窓がずっとくるくるする → 各API5秒タイムアウト・エラー時はローディング停止
- [x] iPhoneレイアウト全般 → 100dvh・44px・safe-area-inset対応
- [x] 持ち時間の入力欄 → 3桁スピナー（▲▼で百・十・一の位を独立操作）に完全置き換え
      type="number"→tel→controlled→contentEditable→ボタン式と試行の末、キーボード廃止で根本解決
      0分のとき∞表示、内部値はINFINITE = 999999 * 60
- [x] iOSでドロップダウンスクロール中に誤選択 → touchmoveで8px以上スクロールしたらフラグを立てて選択スキップ
- [x] スワイプでテキスト入力が飛ぶ → INPUT/TEXTAREA操作中はスワイプ判定をスキップ
- [x] 曲の尺が空欄にできない → type="tel"に変更・0秒のとき∞表示に統一
- [x] デスクトップの開催日カレンダーアイコン → appearance-none + webkit-calendar-picker-indicator非表示

### デバッグ項目（優先度：中）
- [ ] 検索方法の改善 → 「アーティスト」「曲名」「両方」チェックボックス追加 or 入力欄を分割

---

## 1. 設計思想：なぜゼロコストで成立するか

**セトリデータをURLそのものに埋め込む**ことでDBを不要にする。

```
作成者: セトリ編集 → localStorageに自動保存
           ↓「公開URLを生成する」ボタン
        セトリJSON → lz-string圧縮 → URLハッシュに埋め込む
           ↓
        https://setlog.yowofuru.com/s#{compressed}
           ↓ このURLをX・Instagramにシェア
閲覧者: URLを開く → ブラウザがデコード → セトリ表示 → 各サブスクで再生
```

- **DB不要**：データはURLの中にある
- **サーバー不要**：Next.jsの静的ページのみ
- **認証不要**：外部API認証一切不要
- **バズ対応**：Vercel静的配信はスケール無制限
- **コストゼロ**：全API無料・Vercel無料枠で運用

---

## 2. 技術スタック

```
フロントエンド:  Next.js 14 (App Router) + TypeScript
スタイリング:    Tailwind CSS + shadcn/ui
DB:             Supabase（shared_setlistsテーブル・短縮URL用のみ）
               localStorage（編集中データの一時保存）
認証:           なし（外部API認証不要）
外部API:        Deezer API（曲検索・秒数・プレビュー・ISRC・認証不要・無料）
               MusicBrainz API（フォールバック①・無料）
               iTunes Search API（フォールバック②・カタカナ・ライブ録音対応・無料）
               iTunes Lookup API（artistIdで全曲取得・無料）
               odesli API（ISRCからSpotify/Apple Music/YouTube Musicリンク生成）
圧縮:           lz-string（後方互換用・旧/s ページで使用）
i18n:           next-intl（日英自動切り替え・Accept-Languageで判定）
画像生成:       Canvas API + qrcode（npm）
アイコン:       lucide-react
ホスト:         Vercel（無料枠）
広告:           Google AdSense（ca-pub-3638355793094456・申請中）
環境変数:       NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 3. 画面構成・ルーティング

```
/              → トップ・ランディングページ（v2.9で「セトリ作りをもっと楽しく」訴求に更新済み）
/editor        → セトリ作成・編集エディタ（localStorage管理）
/b/[slug]      → バンド固定ページ（slug→バンド名変換済みでエディタを開く）
/s             → セトリ公開ページ（URLハッシュからデータ復元）
```

---

## 4. データ構造（localStorage + URLハッシュ）

### セトリJSON型定義

```typescript
type SetlistItem = {
  id: string
  type: 'song' | 'mc' | 'se'
  title: string
  artist?: string
  duration_seconds: number
  isrc?: string             // Deezer取得時のみ（odesliに渡す）
  preview_url?: string      // Deezer・iTunes取得時（30秒プレビュー）
  apple_music_url?: string  // iTunes取得時
  youtube_id?: string       // video IDのみ保存（11文字）。URLハッシュ短縮のため
                             // 表示時に https://www.youtube.com/watch?v={id} を再構成
  source?: 'deezer' | 'musicbrainz' | 'itunes' | 'manual'
  generated?: boolean       // true: 自動生成曲。次回自動生成時に入れ替え対象。false: ユーザー固定項目
  note?: string
}

type Setlist = {
  title: string             // "2024/12/14 渋谷CLUB QUATTRO"
  band_name: string
  venue_name?: string
  venue_url?: string
  event_date?: string       // "2024-12-14"
  target_seconds: number    // 持ち時間（秒換算）
  items: SetlistItem[]
  created_at: string
}
```

### localStorage のキー設計

```
setlist:current        → 現在編集中のSetlist JSON（自動保存）
setlist:history        → 過去セトリのIDリスト（最大10件）
setlist:{nanoid}       → 保存済みセトリ
image:settings         → 画像カスタマイザー設定（bgColor, textColor, font, bgScale, bgOffsetX, bgOffsetY）
image:layout           → 画像カスタマイザーレイアウト（logoX, logoY, logoSize, qrX, qrY, textX, textY）
image:bg               → 背景画像（DataURL）
band:logo              → バンドロゴ画像（DataURL）
```

### URL共有フォーマット

```
公開URL: https://setlog.yowofuru.com/s/{8文字のショートID}
例:      https://setlog.yowofuru.com/s/abc12345
```

- セトリ公開時に `/api/share` POSTでSupabaseに保存
- ショートID（nanoid 8文字）を生成して返す
- QRコードが読めるレベルのコンパクトなURLを実現
- 旧URLハッシュ方式（`/s#...`）は後方互換のため残存

### Supabaseテーブル設計

```sql
create table public.shared_setlists (
  id text primary key,        -- nanoid 8文字
  data jsonb not null,        -- Setlist JSON
  created_at timestamptz default now()
);
-- RLS設定
alter table public.shared_setlists enable row level security;
create policy "Public read" on public.shared_setlists for select using (true);
create policy "Public insert" on public.shared_setlists for insert with check (true);
```

---

## 5. 主要機能仕様

### 5-1. 曲検索（4段階フォールバック + artistId直接検索）✅ 実装済み

```
① Deezerで検索（認証不要）
   GET https://api.deezer.com/search?q={query}&limit=10
   取得: title / artist / duration / isrc / preview / link
   → ヒットあり: 全フィールド取得（source: 'deezer'）

② 日本語クエリ（ひらがな・カタカナ・漢字）はMusicBrainzをスキップ
   ※ MusicBrainzが日本語クエリに対して微妙な結果を返してフォールバックが止まるため
   const isJP = /[぀-ゟ゠-ヿ一-鿿]/.test(value)
   if (!isJP) → MusicBrainzへ
   if (isJP)  → 直接iTunesへ

③ MusicBrainzで検索（英語クエリのみ）
   GET https://musicbrainz.org/ws/2/recording/?query={query}&fmt=json
   User-Agent: SETLOG/1.0 (https://setlog.yowofuru.com) 必須
   → ヒットあり: 追加（source: 'musicbrainz'）

④ iTunes Search APIで検索
   GET /api/itunes/search?q={query}（API Route経由・CORS回避）
   → サーバーサイドでiTunes APIを叩く
   → User-Agent: 'SETLOG/1.0 (https://setlog.yowofuru.com)' 必須（ないとVercelのIPがブロックされる）
   → cache: 'no-store'
   → クエリをそのまま term= に渡す（attribute分割クエリは使わない）
   → 日本語クエリはひらがな変換版でも並行検索してマージ
      例: 「吉美四季」→ そのまま + 「よしみしき」で並行検索

⑤ すべてヒットなし → 手動入力フォームを表示

【特殊対応】Apple Music artistIdによる直接ルックアップ ✅ 実装済み
   検索0件時に「Apple MusicのアーティストページURLの末尾IDを入力」UIを表示
   例: https://music.apple.com/jp/artist/シキソクゼクウ/1513117188 → 1513117188
   GET /api/itunes/lookup?id={artistId}（API Route経由）
   → アーティストの全曲をドロップダウン表示
```

ドロップダウンに出典元を小さく表示（Deezer / MusicBrainz / iTunes）。

### 5-2. odesli API（マルチサブスクリンク生成）✅ 実装済み

```
GET https://api.song.link/v1-alpha.1/links?isrc={isrc}&userCountry=JP

取得: spotify / appleMusic / youtube / youtubeMusic / deezer の各URL
```

- isrcがある曲（Deezer取得）のみリクエスト
- 曲クリック時に遅延取得（レート制限10req/分対策）

### 5-3. セトリエディタ（/editor）✅ 実装済み

- バンド名・タイトル・会場名・会場URL・開催日・持ち時間を入力
- 曲・MC・SEをドラッグ&ドロップで並び替え（@dnd-kit/core）
- 合計時間をリアルタイム計算・持ち時間との差分を色で表示
- localStorageに自動保存
- 3ステップ導線を表示：①バンド名を入力 → ②必要ならMC/SEを先に追加 → ③残り時間に曲を自動生成
- 「残り時間に曲を自動生成」ボタン：バンド名でiTunes検索 → artistId取得 → 全曲ルックアップ → 残り時間内でランダム選曲
- 「専用URL発行」ボタン：バンド名をslug化して `/b/{slug}` URLを生成・コピー
- 曲リスト上に状態ラベルを表示：`自動生成` / `固定` / `MC` / `SE`
- 自動生成曲には「固定する」操作を表示し、押すと `generated:false` になり次回生成でも残る
- `generated:true` の曲が存在する場合のみ「自動生成曲をクリア」ボタンを表示
- 自動生成実行時の確認ダイアログは廃止し、何度も試しやすいUXに変更

#### 5-3a. 自動生成・固定項目仕様 ✅ 実装済み

自動生成は「全セトリを作り直す」ではなく、固定項目を残して残り時間に曲を入れる。

```
固定項目: MC / SE / 手動追加曲 / 固定した生成曲
入替項目: generated:true の自動生成曲
旧データ互換: generated が未定義で apple_music_url / preview_url を持つ song は自動生成由来として扱う
```

- 自動生成開始時に `fixedItems` と `replaceableItems` を分離
- 残り時間計算・無限時間チェック・重複判定は `fixedItems` 基準
- 新しく追加する自動生成曲には `source:'itunes'` と `generated:true` を付与
- AddItemModalからユーザーが追加/編集した項目には `generated:false` を付与し固定扱い
- 再生成時は `items: [...fixedItems, ...newItems]` で前回の自動生成曲だけ入れ替える
- 「固定する」を押した曲は `generated:false` になり、以後は固定曲として残る
- 「自動生成曲をクリア」は `generated:true` の曲だけ削除し、MC/SE/固定曲は残す

#### 5-3b. 自動生成の重複除外・選曲精度 ✅ 実装済み

- 曲名正規化で Live / Remaster / Version / Edit / Mix / Demo / Acoustic / feat. 等の表記差を除去
- artist名ではなく正規化した曲名のみで重複判定
- 同じ曲名の別バージョンは複数入れない
- 固定曲と同名の候補曲も追加しない
- 残り時間を超える候補曲は `break` ではなく `continue` でスキップし、短い曲を探す
- 50回シャッフル試行し、残り時間を最も埋める組み合わせを採用（∞指定時は1回）
- 候補曲0件の場合と、候補はあるが残り時間に入らない場合でエラーメッセージを分離

### 5-4. 曲追加モーダル ✅ 実装済み

- 「検索」タブ：4段階フォールバック検索・ドロップダウン表示
- 「手動入力」タブ：曲名・アーティスト・時間（MM:SS）・YouTube URL（任意）
- 追加済みの曲の編集時：時間（MM:SS）を手動で上書き可能・YouTube URLを追加・編集可能
- MCボタン：タイトル（デフォルト"MC"）+ 時間（デフォルト 2:00）
- SEボタン：検索または手動入力（デフォルト 0:30）

### 5-4b. バンド固定ページ（/b/[slug]）✅ 実装済み

- URL: `setlog.yowofuru.com/b/{slug}`（例: `/b/ulma-sound-junction`）
- slug → バンド名変換: ハイフンをスペースに、各単語を大文字化（例: `ulma-sound-junction` → `Ulma Sound Junction`）
- URLエンコードされた日本語スラッグにも対応（`decodeURIComponent`）
- バンド名を初期値にセットした状態でエディタを開く（localStorageには依存しない・常に新規）
- エディタの `initialBandName` propで実現。バンド固定ページからは自動生成ボタンをそのまま使える
- slug変換ルール: 小文字化・スペース/アンダースコア→ハイフン・非英数字除去・連続ハイフン圧縮
- 日本語バンド名はURLエンコードされた状態でスラッグになるか、ローマ字入力を推奨

### 5-5. 公開URLの生成と共有 ✅ 実装済み

1. 「公開URLを生成する」ボタン
2. JSON → lz-string圧縮 → URLハッシュ生成
3. URL表示 + コピーボタン
4. Xシェアボタン（日英併記）：
   ```
   【セトリ公開】/ Setlist now live
   全{n}曲 / {合計時間} · {n} songs
   お好きなサブスクで聴き直せます🎵
   Listen on your fav streaming service
   {URL}
   #SETLOG #setlist
   ```
5. 「画像をダウンロード＆Xで投稿」：Canvas画像DL + X投稿画面を同時に開く
6. Instagram用画像生成（1080x1080px PNG）：
   - バンド名・日付・会場・曲目リストを描画
   - 右下にQRコード（公開URL）を埋め込む
   - 右下隅に著作権表示

### 5-5b. 画像カスタマイザー（ImageCustomizerModal）✅ 実装済み

カスタマイズ可能な1080×1080px正方形画像をCanvasで生成。設定はlocalStorageに保存・次回引き継ぎ。

**背景タブ** ✅ 実装済み
- 背景色（カラーピッカー + HEX直入力）
- 背景画像アップロード（PNG/JPG・最大5MB）
- 表示モード: contain（縦横比保持）+ スケール（0.1〜3.0倍）+ XYオフセット
- 描画ロジック:
  ```
  imgAspect > 1 → drawW = CS * bgScale; drawH = drawW / imgAspect
  imgAspect ≤ 1 → drawH = CS * bgScale; drawW = drawH * imgAspect
  offsetX = (CS - drawW) / 2 + bgOffsetX
  offsetY = (CS - drawH) / 2 + bgOffsetY
  ```

**テキストタブ** ✅ 実装済み
- テキスト色（カラーピッカー + HEX直入力）
- フォント選択（Geist / Noto Sans JP / Shippori Mincho / M PLUS Rounded 1c / Zen Kaku Gothic New）

**ロゴ・QR配置タブ** ✅ 実装済み
- ロゴ画像アップロード（PNG推奨・最大3MB）：実装済み
- ロゴ描画（縦横比保持）：実装済み
- プレビュー上でドラッグしてロゴ・QR・テキストブロックを配置：実装済み
- ロゴリサイズ：右下ハンドルでリサイズ。`setPointerCapture` / `releasePointerCapture` 対応でiOS/Safari/Dialog内のドラッグを安定化
- ロゴ移動・ロゴリサイズ・QR移動・テキスト移動はいずれも pointer event ベースに統一
- 画像出力にはエディタ内部ラベル（自動生成/固定）は表示しない

### 5-6. YouTube URL自動取得 ✅ 実装済み

```
YouTube URLを入力すると（onChange、video ID 11文字が揃った時点で即実行）：

GET /api/youtube/info?url={youtube_url}

実装：
① YouTube Data API v3で動画情報取得
   GET https://www.googleapis.com/youtube/v3/videos?id={videoId}&part=contentDetails,snippet&key={YOUTUBE_API_KEY}
   → contentDetails.duration（ISO 8601形式 "PT4M33S"）をパースして秒数に変換
   → snippet.title でタイトル取得
   1日10000ユニット（動画1件=1ユニット）の無料枠で運用

② 取得したtitle・duration_secondsを自動入力（ユーザーが上書き可能）
③ durationが取得できない場合のみ手動入力を促す（∞表示は廃止、0:00表示）

保存形式：
- youtube_idのみ保存（video ID 11文字）
- フルURL（43文字）を保存するとURLハッシュが長くなるため
- 表示時に https://www.youtube.com/watch?v={youtube_id} を再構成
```

### 5-7. セトリ公開ページ（/s）✅ 実装済み

- URLハッシュからセトリJSONを復元して表示（サーバー処理ゼロ）
- 各曲にDeezerプレビュー再生ボタン（isrcあり曲のみ）
- odesliで生成したSpotify・Apple Music・YouTube Musicリンクを表示
- 「▶ 30秒プレビューを順番に再生」ボタン
- 「このセトリをベースに自分で編集する」ボタン
- 広告（AdSense）：公開ページ下部のみ

### 5-8. iPhone / モバイルUI確認メモ 🔧 確認中

バンドマンがスマホで使う前提のため、iPhone実機確認を優先する。

確認済み/対応済み:
- 3ステップ案内はスマホでは縦並び、PCでは広い幅のみ3カラム
- 持ち時間入力はキーボードを出さない3桁スピナー方式
- 自動生成CTAはバンド名入力欄の下に大きく配置

要確認/修正候補:
- 曲リスト右側の操作ボタンが `group-hover` 依存だとiPhoneで見えないため、スマホ幅では常時表示にする
  - 推奨: `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`
- 自動生成曲の「固定する」はスマホではアイコンだけでなくテキスト付きが望ましい
- 自動生成/固定ラベルが長い曲名を圧迫する場合、タイトル横ではなくタイトル下のbadge行に移す
- 「自動生成曲をクリア」ボタンはスマホでは `w-full`、PCでは `sm:w-auto sm:ml-auto` が望ましい
- 横スクロールが出ないことを iPhone SE / iPhone 13 幅で確認する


### 5-9. PWA / ホーム画面追加対応 ✅ 実装済み

スマホで素早く開けるよう、iPhone / Androidの「ホーム画面に追加」運用を想定。

実装内容:
- `src/app/manifest.ts`
  - `name`: SETLOG
  - `short_name`: SETLOG
  - `start_url`: `/editor`
  - `display`: `standalone`
  - `background_color`: `#0a0a0a`
  - `theme_color`: `#0a0a0a`
  - icons: 192 / 512 / maskable 512
- `src/app/layout.tsx`
  - `manifest: /manifest.webmanifest`
  - `icons.icon`: 192 / 512 PNG
  - `icons.apple`: 180 PNG
  - `appleWebApp.capable: true`
  - `appleWebApp.title: SETLOG`
  - `appleWebApp.statusBarStyle: black-translucent`
- `public/icons/`
  - `setlog-icon-180.png`
  - `setlog-icon-192.png`
  - `setlog-icon-512.png`
  - `setlog-maskable-512.png`
  - 既存 `icon.svg` から `sharp` で生成
- `src/components/AddToHomeScreenHint.tsx`
  - iOS Safari でのみ表示（iPhone / iPad / iPod）
  - iPadOS 13+ 対応: `navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1`
  - iOS Chrome / Firefox / Edge / Opera は除外（CriOS / FxiOS / EdgiOS / OPiOS）
  - standalone 起動中は非表示
  - 一度閉じたら `localStorage: setlog:add-to-home-screen-hint-dismissed` で再表示しない
  - `?showA2HS=1` クエリパラメータで強制表示（iOS判定・dismissed 無視、standalone のみ非表示）
  - 表示文: 共有ボタンから「ホーム画面に追加」すると、アプリのように使えます。

デバッグ用 URL:
```
https://setlog.yowofuru.com/editor?showA2HS=1
```

再表示テスト:
```javascript
localStorage.removeItem('setlog:add-to-home-screen-hint-dismissed')
location.reload()
```

確認項目:
- `/manifest.webmanifest` が200で返る
- `/icons/setlog-icon-180.png` などが200で返る
- iPhone Safariで `/editor` を開くと案内が出る
- 閉じると再表示されない
- ホーム画面起動中は案内が出ない
- ホーム画面追加時にSETLOGアイコンが表示される
- ホーム画面から起動すると `/editor` が開く

### 5-10. トップページ / LP コピー v2.9 ✅ 実装済み

方針:
- 「本番前の尺調整」訴求ではなく、「セトリ作りをもっと楽しく」方向へ寄せる
- 持ち曲から、ガチャのように思いがけないセトリを生成できることを前面に出す
- 終演後のセトリ投稿画像を、アー写・フライヤー・ロゴ・フォントで作れることも主要価値として出す
- ストリーミングは「連携」ではなく「検索リンク」と表現する
- 「最適な曲順」「完璧なセトリ」「AIが作る」「サブスク連携」は使わない

実装済み構成:
- H1: セトリ作りを、もっと楽しく。
- サブコピー: バンド名と持ち時間を入れるだけ。…終演後のセトリ画像も…
- CTA: セトリを作る → （/editor）
- 機能セクション見出し: 持ち曲から、思いがけないセトリを作る。
- 機能カード 2×2: 自動生成 / 固定 / MC・SE管理 / セトリ画像
- ストリーミング説明: 検索リンクを自動表示（「連携」は使わない）
- ホーム画面追加案内カード（Smartphone アイコン付き）
- 下部 CTA: 削除（不要と判断）

#### 日本語コピー

Hero見出し:

```
持ち曲から、思いがけないセトリを作る。
```

Heroサブコピー:

```
バンド名と持ち時間を入れるだけ。
曲・MC・SEを並べて、残り時間に合う曲をSETLOGが自動生成します。
終演後のセトリ画像も、アー写・フライヤー・ロゴ・フォントを選んでそのまま作れます。
```

補足バッジ:

```
登録不要・無料
```

CTAメイン:

```
セトリを作る
```

機能見出し:

```
セトリ作りを、もっと楽しく。
```

機能カード1:

```
タイトル: 持ち曲でセトリを自動生成
本文: バンド名と持ち時間を入れると、残り時間に合う曲をランダムに生成。いつもと違う曲順や、思いがけない組み合わせに出会えます。
```

機能カード2:

```
タイトル: 気に入った曲は固定
本文: 自動生成は何度でもやり直せます。残したい曲だけ固定して、あとは入れ替えるだけ。
```

機能カード3:

```
タイトル: MC・SEも一緒に管理
本文: 曲だけでなく、MCやSEも秒数込みで追加。合計時間と残り時間を見ながらセトリを組めます。
```

機能カード4:

```
タイトル: セトリ画像をその場で作成
本文: アー写・フライヤー・ロゴを使って、終演後のセトリ投稿画像を作成。フォントも選べるので、Canvaを開く手間を減らせます。
```

ストリーミングリンク説明:

```
公開したセトリには、Spotify・Apple Music・YouTube Music・Deezer の検索リンクを自動表示。
気になった曲をそのまま聴いてもらえます。
```

ホーム画面追加説明:

```
共有ボタンから「ホーム画面に追加」すると、アプリのように使えます。
```

下部CTA見出し:

```
次のセトリを、ガチャってみる。
```

下部CTA本文:

```
持ち時間を入れて、自動生成。
気に入った曲を固定して、終演後はそのまま画像で投稿できます。
```

下部CTAボタン:

```
作成する
```

#### 英語コピー

Hero heading:

```
Create unexpected setlists from your own songs.
```

Hero subcopy:

```
Enter a band name and set time.
SETLOG generates songs for the remaining time while keeping your songs, MCs, and SEs in place.
After the show, create a setlist image with your artist photo, flyer, logo, and fonts.
```

Badge:

```
Free. No sign-up required.
```

Main CTA:

```
Create a setlist
```

Feature heading:

```
Make setlist building more fun.
```

Feature card 1:

```
Title: Generate setlists from your songs
Body: Enter a band name and set time to randomly generate songs that fit the remaining time. Discover unexpected orders and combinations.
```

Feature card 2:

```
Title: Pin the songs you like
Body: Regenerate as many times as you want. Pin the songs you want to keep, then shuffle the rest.
```

Feature card 3:

```
Title: Manage MCs and SEs too
Body: Add songs, MCs, and SEs with exact timing. See the total time and remaining time as you build.
```

Feature card 4:

```
Title: Create setlist images instantly
Body: Use your artist photo, flyer, or logo to create a setlist image after the show. Choose fonts and skip the extra Canva work.
```

Streaming links:

```
Published setlists automatically show search links for Spotify, Apple Music, YouTube Music, and Deezer, so listeners can find the songs quickly.
```

Home screen hint:

```
Add SETLOG to your Home Screen from the share button to use it like an app.
```

Bottom CTA heading:

```
Try a new setlist.
```

Bottom CTA body:

```
Enter the set time, generate songs, pin what you like, and post a setlist image after the show.
```

Bottom CTA button:

```
Start creating
```

#### 実装対象

- `src/app/page.tsx`
- トップページ用コンポーネントが分かれている場合は該当ファイル
- `messages/ja.json`
- `messages/en.json`

#### 対象外

- ShareModal
- 公開ページ
- 画像生成ロジック
- SNS投稿テンプレート
- エディタ画面の機能ロジック


---

## 6. 環境変数

```env
NEXT_PUBLIC_APP_URL=https://setlog.yowofuru.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
YOUTUBE_API_KEY=...
```

---

## 7. デザイン方針

- **カラー**：モノトーン（どのサブスクにも属さない独自感）
  - 背景: `#0a0a0a` / カード: `#1a1a1a` / アクセント: `#ffffff`
  - テキスト: `#ffffff`（メイン）/ `#888888`（サブ）
- **アイコン**：lucide-react（無料・商用利用OK）
- **フォント**：`Geist`（Next.jsデフォルト）
- **UI**：shadcn/ui ベース・シンプルかつプロフェッショナル
- **モバイルファースト**：バンドマンはスマホで使う場面が多い

---

## 8. 国際化（i18n）✅ 実装済み

- **対応言語**：日本語（ja）・英語（en）
- **ライブラリ**：`next-intl`
- **言語判定**：ブラウザの `Accept-Language` ヘッダーで自動判定
- **デフォルト**：英語（en）
- **対象**：UI上の全ラベル・ボタン・プレースホルダー・エラーメッセージ

---

## 9. 著作権表示・フッター ✅ 実装済み

```
© 2026- SETLOG by Yowofuru LLC / Yoshimisiki
```

- アプリフッター（全ページ共通）
- シェア画像右下（小テキスト）
- `Yowofuru LLC` → https://yowofuru.com
- `Yoshimisiki` → https://yoshimisiki.com

---

## 10. 重要な実装ノート

### Deezer API
- CORS対応済み・クライアントから直接叩ける
- `duration`が秒数（整数）で直接使える
- `preview`が30秒MP3 URL（認証不要）
- `isrc`でodesliと連携

### MusicBrainz API
- User-Agentヘッダー必須：`SETLOG/1.0 (https://setlog.yowofuru.com)`
- durationが不正確なことがあるので追加後に手動編集可能にすること

### iTunes Search / Lookup API
- カタカナ検索はひらがな変換版でも並行検索
- artistId lookupで非メジャー・ライブ録音バンドも対応
- `trackTimeMillis ÷ 1000` で秒数取得
- 自動生成時は `source:'itunes'` / `generated:true` を付与
- AddItemModalから検索追加した曲は `source` が iTunes/Deezer 等でも `generated:false` のため固定扱い

### odesli API
- 無料枠：10リクエスト/分
- 曲クリック時の遅延取得で対応

### lz-stringによるURL圧縮
- `LZString.compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`
- 60〜70%圧縮で曲20曲程度でもXに投稿できる長さに収まる

### Google AdSense
- アカウント：ca-pub-3638355793094456
- 配置：公開ページ（/s）下部のみ

### 自動生成状態管理
- `generated:true`：自動生成曲。次回自動生成で入れ替え対象
- `generated:false`：ユーザー追加/固定項目。次回自動生成でも残す
- `generated` 未定義：旧データ互換。song かつ apple_music_url / preview_url があれば自動生成由来として扱う
- 判定関数 `isAutoGeneratedItem(item)` を基準に、入替・ラベル・固定ボタン・クリアボタンの条件を揃えること
- `source` は情報取得元であり、固定/入替の主判定には使わない。主判定は `generated`

---

## 11. 将来拡張メモ（Phase 2以降）

- iOS/Androidアプリ（React Native / Expo）
- Apple Music連携（MusicKit JS）
- QRコード表示（ライブ会場でスクリーンに映す）
- セトリ分析（平均BPM・調性バランス）
- 有料プラン（広告非表示）

---

## 🔒 公開しないメモ

- Supabase無料枠：500MB・50k MAU。shared_setlistsは1件あたり約5KB、10万件保存しても500MBに収まる。バズっても問題なし
- Spotify API：Developer Mode 5ユーザー上限・Premium必須のため完全移行。Dashboardのアプリは放置でOK
- Deezer：日本インディーズは弱い。MusicBrainz・iTunesフォールバックで補完済み
- iTunes artistId lookup：カタカナバンド名・ライブ録音音源の最終手段として有効
- odesli：無料枠10req/分。遅延取得で問題なし
- Vercel帯域100GB/月：静的配信なので数万PV程度まで問題なし
- よをふる合同会社名義でのSpotify Extended Quota申請はMAU25万超えたら検討

---

## 変更履歴

| バージョン | 内容 |
|---|---|
| v2.0 | Supabase/認証を削除、localStorage + URLハッシュ方式に移行 |
| v2.1 | アプリ名をSETLOGに確定、開発者名追加、Spotify検索の動作確認内容を反映 |
| v2.2 | Spotify API断念 → Deezer/MusicBrainz/iTunesの4段階フォールバック検索に全面移行、odesli連携追加 |
| v2.3 | URLハッシュ（#）方式をSupabase + ショートID（/s/{id}）方式に変更（QRコード問題の解決） |
| v2.4 | iOSモバイルUXデバッグ一式完了（持ち時間3桁スピナー化、検索誤選択防止、スワイプ干渉修正など） |
| v2.5 | YouTube URL自動取得機能追加（YouTube Data API v3）、youtube_url→youtube_id化でURL短縮 |
| v2.6 | 画像カスタマイザー全面リライト（背景contain描画・ロゴ等倍・リサイズハンドルをoverlay子要素化）、バンド固定ページ /b/[slug] 追加、セトリ自動生成ボタン追加 |
| v2.7 | 自動生成UX改善：3ステップ導線、MC/SE/固定曲を残して残り時間のみランダム生成、generatedフラグ追加、生成曲ラベル/固定する/生成曲クリア、同名曲正規化重複除外、50回試行シャッフル、iPhone操作ボタン常時表示対応・実機確認済み |
| v2.8 | PWA/ホーム画面追加対応（manifest.ts / apple-touch-icon / AddToHomeScreenHint）、SETLOGアイコン生成（sharp）、iPadOS対応・?showA2HS=1デバッグ追加 |
| v2.9 | トップページコピー実装：H1「セトリ作りを、もっと楽しく。」機能カード2×2・下部CTAは削除・ストリーミングを「検索リンク」表現に統一。spec最新化（現状・TODO・5-10・5-9更新） |
