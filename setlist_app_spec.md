# SETLOG 開発仕様書
## v2.6 最終版

**アプリ名**: SETLOG — Setlist maker for live musicians
**開発者**: よをふる合同会社 / Yowofuru LLC
**URL**: https://setlog.yowofuru.com
**ステータス**: 公開済み

---

## 概要
バンドマンが持ち時間に合わせてセトリを組み、URLひとつでシェア。
リンクを受け取ったファンがSpotify・Apple Music・YouTube Music・Deezerで聴き直せる。
アカウント不要・完全無料・ゼロコスト運用。

## 現状
ステータス: 公開済み v2.6

## 次TODO
- [ ] youtube_url → youtube_id へのデータ移行（URLハッシュ短縮）
- [ ] Google AdSense 申請・審査通過・組み込み
- [ ] バンドマンへのテスト使用・フィードバック収集

### デバッグ項目（優先度：高）
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
/              → トップ・ランディングページ
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
- 「自動生成」ボタン：バンド名でiTunes検索 → artistId取得 → 全曲ルックアップ → 持ち時間内でシャッフル選曲
- 「専用URL発行」ボタン：バンド名をslug化して `/b/{slug}` URLを生成・コピー

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

**背景タブ**
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

**テキストタブ**
- テキスト色（カラーピッカー + HEX直入力）
- フォント選択（Geist / Noto Sans JP / Shippori Mincho / M PLUS Rounded 1c / Zen Kaku Gothic New）

**ロゴ・QR配置タブ**
- ロゴ画像アップロード（PNG推奨・最大3MB）
- ロゴ描画: 縦横比保持（logoDrawW=logoSize, logoDrawH=logoSize/aspect）
- プレビュー上でドラッグしてロゴ・QR・テキストブロックを配置
- ロゴリサイズ: Canvasの上に重ねた透明overlay divの右下ハンドルをPointerEventでドラッグ
  - ハンドルはロゴ移動divの**子要素**として配置（兄弟要素にするとzIndex競合）
  - `onPointerDown` + `window.addEventListener('pointermove'/'pointerup')` でマウス・タッチ両対応
  - canvas座標 ↔ display座標の変換: `sc = containerRef.offsetWidth / 1080`
- overflow:hiddenなし（ハンドルがクリップされないよう）

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

### odesli API
- 無料枠：10リクエスト/分
- 曲クリック時の遅延取得で対応

### lz-stringによるURL圧縮
- `LZString.compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`
- 60〜70%圧縮で曲20曲程度でもXに投稿できる長さに収まる

### Google AdSense
- アカウント：ca-pub-3638355793094456
- 配置：公開ページ（/s）下部のみ

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
