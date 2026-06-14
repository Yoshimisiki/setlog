# SETLOG 開発仕様書
## Claude Code 実装指示書 v2.1（ゼロコスト構成）

**アプリ名**: SETLOG
**開発者**: よをふる合同会社 / Yowofuru LLC

---

## 概要
バンドマンが持ち時間に合わせてSpotifyでセトリを組み、SNSでシェア。
リンクを受け取ったファンがそのセトリをその場で聴いたり、Spotifyプレイリストとして保存できる。

## 現状
ステータス: 開発中 v2.1

## 次TODO
- [ ] 次の追加・修正事項をここに記載する

---

## 1. 設計思想：なぜゼロコストで成立するか

**セトリデータをURLそのものに埋め込む**ことでDBを不要にする。

```
作成者: セトリ編集 → localStorageに保存
           ↓「公開する」ボタン
        セトリJSONをBase64エンコード → URLハッシュに埋め込む
           ↓
        https://setlog.yowofuru.com/s#eyJ0aXRsZSI6...
           ↓ このURLをXやInstagramにシェア
閲覧者: URLを開く → ブラウザがハッシュをデコード → セトリ表示
```

- **DB不要**：データはURLの中にある
- **サーバー不要**：Next.jsの静的ページのみ
- **認証不要**：Spotify PKCEフローでクライアントのみで完結
- **バズ対応**：Vercel/Cloudflareの静的配信はスケール無制限

---

## 2. 技術スタック

```
フロントエンド:  Next.js 14 (App Router) + TypeScript
スタイリング:    Tailwind CSS + shadcn/ui
DB:             なし（localStorage + URLハッシュ）
認証:           なし（外部API認証不要）
外部API:        Deezer API（曲検索・秒数・プレビュー・ISRC取得・認証不要・無料）
               odesli API（ISRCからSpotify/Apple Music/YouTube Musicリンク生成）
ホスト:         Vercel（無料枠）または Cloudflare Pages（バズ耐性高）
広告:           Google AdSense
環境変数:       なし（APIキー不要）
```

---

## 3. 画面構成・ルーティング

```
/              → トップ・使い方説明
/editor        → セトリ作成・編集エディタ（localStorage管理）
/s             → セトリ公開ページ（URLハッシュからデータ復元）
```

アーティストページ・ダッシュボード・ログイン画面は**不要・削除**。

---

## 4. データ構造（localStorage + URLハッシュ）

### セトリJSON型定義

```typescript
type SetlistItem = {
  id: string           // nanoid（ローカル管理用）
  type: 'song' | 'mc' | 'se'
  title: string
  artist?: string
  duration_seconds: number
  spotify_track_id?: string
  spotify_preview_url?: string
  spotify_url?: string
  note?: string
}

type Setlist = {
  title: string          // "2024/12/14 渋谷CLUB QUATTRO"
  band_name: string
  venue_name?: string
  venue_url?: string     // Google MapsリンクなどURL
  event_date?: string    // "2024-12-14"
  target_seconds: number // 持ち時間（秒換算）
  items: SetlistItem[]
  created_at: string
}
```

### localStorage のキー設計

```
setlist:current        → 現在編集中のSetlist JSON
setlist:history        → 過去セトリのIDリスト（最大10件）
setlist:{nanoid}       → 保存済みセトリ（ローカル履歴用）
spotify:access_token   → Spotifyアクセストークン
spotify:token_expires  → トークン有効期限
```

### URL共有フォーマット

```typescript
// 公開URL生成（lz-stringで圧縮してからエンコード）
import LZString from 'lz-string'
const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(setlist))
const shareUrl = `https://setlog.yowofuru.com/s#${compressed}`

// 公開ページ復元
const decompressed = LZString.decompressFromEncodedURIComponent(location.hash.slice(1))
const setlist: Setlist = JSON.parse(decompressed)
```

**URL長の目安**：lz-stringで60〜70%圧縮。曲数15〜20曲でもXに投稿できる長さに収まる。

---

## 5. 主要機能仕様

### 5-1. 曲検索 API（Deezer + odesli）

#### Deezer API（認証不要・APIキー不要・完全無料）

```typescript
// 曲検索（認証不要）
GET https://api.deezer.com/search?q={query}&limit=10

// レスポンスから取得するフィールド
{
  id: number,           // Deezer Track ID
  title: string,        // 曲名
  artist: { name },     // アーティスト名
  duration: number,     // 秒数（そのままduration_secondsに使う）
  isrc: string,         // 国際標準レコーディングコード（odesliに渡す）
  preview: string,      // 30秒プレビューMP3 URL（認証不要で再生可）
  link: string,         // Deezerの曲ページURL
}
```

#### odesli API（ISRCからマルチサブスクリンクを生成）

```typescript
// ISRCからSpotify・Apple Music・YouTube Musicなどのリンクを取得
GET https://api.song.link/v1-alpha.1/links?isrc={isrc}&userCountry=JP

// レスポンスから取得するフィールド
{
  linksByPlatform: {
    spotify: { url },
    appleMusic: { url },
    youtube: { url },
    youtubeMusic: { url },
    // など
  }
}
```

**データの流れ：**
```
ユーザーが曲名入力
  → Deezer APIで検索 → ドロップダウン表示
  → 選択 → title / artist / duration / isrc / preview_url を保存
  → 公開URL生成時 or 公開ページ表示時にodesliでリンク生成
  → ファンがSpotify/Apple Music/YouTube Musicで聴ける
```

- 認証不要・APIキー不要・ユーザー数制限なし
- 手動入力の場合はisrcなし → odesliリンクなし（曲名のみ表示）

### 5-2. セトリエディタ（/editor）

```
┌─────────────────────────────────────────────────┐
│  バンド名: [The Clocks]                          │
│  タイトル: [2024/12/14 渋谷CLUB QUATTRO]         │
│  持ち時間: [45] 分   合計: 42:30 / 45:00 ■■■□  │
├─────────────────────────────────────────────────┤
│  #  種別  曲名              時間    操作          │
│  1  🎵   愛の歌             4:23   ↑↓ ✏ ✕      │
│  2  🎤   MC                 2:00   ↑↓ ✏ ✕      │
│  3  🎵   夜の海              3:45   ↑↓ ✏ ✕      │
├─────────────────────────────────────────────────┤
│  [+ 曲を追加] [+ MCを追加] [+ SEを追加]          │
│                              [公開URLを生成する]  │
└─────────────────────────────────────────────────┘
```

- **自動保存**：変更のたびに `setlist:current` へlocalStorage保存
- **ドラッグ&ドロップ**：`@dnd-kit/core` で並び替え
- **合計時間**：全itemのduration_secondsをリアルタイム合計、色で過不足表示
  - 緑：5分以上余裕あり
  - 黄：±5分以内
  - 赤：持ち時間オーバー

### 5-3. 曲追加モーダル

タブ切り替え：「Spotifyで検索」 ｜ 「手動入力」

**Deezer検索タブ** ✅ 実装済み（Spotify→Deezerに変更）
- バンド名・曲名どちらでも検索可能（認証不要）
- 入力ワードが前中後どこかに含まれていればヒット
- 300msデバウンスでリアルタイム検索
- 結果をドロップダウンで表示（曲名・アーティスト・時間）
- タップで追加（duration・isrc・preview_urlを自動取得）
- SEもこのDeezer検索から選択可能 ✅ 実装済み

**手動入力タブ**
- 曲名（必須）
- アーティスト名（任意）
- 時間（MM:SS形式、必須）
- Apple MusicのURL（任意・公開ページでリンク表示用）

**MCボタン（モーダル外・専用）**
- タップ → タイトル（デフォルト"MC"）+ 時間（MM:SS）入力 → 追加

**Spotifyにない曲・MC・SEのシェア時の扱い** ✅ 実装済み
- `spotify_track_id` が存在しないアイテムはプレイリスト保存時にスキップ
- 公開ページのセトリ表示には全アイテム表示（MCもSEも見える）
- Spotifyリンクボタンはtrack_idがある曲のみ表示

### 5-4. 公開URLの生成と共有

1. 「公開URLを生成する」ボタン
2. JSON → Base64エンコード → URLハッシュに埋め込む
3. モーダルでURL表示 + コピーボタン
4. X(Twitter)シェアボタン：
   ```
   【セトリ公開】2024/12/14 渋谷CLUB QUATTRO
   全8曲 / 42分30秒
   Spotifyで聴き直せます🎵
   {URL}
   #setlist
   ```
5. Instagram用画像生成ボタン（Canvas API、1080x1080px PNG）
   - バンド名・日付・会場・曲目リストをスタイリッシュに描画
   - 右下に公開URLのQRコードを埋め込む
   - QRコード生成ライブラリ：`qrcode`（npm、無料）
   - 「画像をダウンロード」ボタンでPNG保存

### 5-5. セトリ公開ページ（/s）

URLハッシュからJSONを復元して表示。**サーバー処理ゼロ・完全静的。**

```
┌─────────────────────────────────────────────────┐
│  The Clocks                                     │
│  📍 渋谷CLUB QUATTRO  📅 2024/12/14  ⏱ 42:30  │
├─────────────────────────────────────────────────┤
│  #   曲名           時間  ▶ プレビュー  リンク   │
│  1.  愛の歌         4:23  ▶            🎵🍎▶   │
│  2.  MC             2:00  💬                     │
│  3.  夜の海          3:45  ▶            🎵🍎▶   │
├─────────────────────────────────────────────────┤
│  [▶ 30秒プレビューを順番に再生]                  │
│  [🎵 Spotify] [🍎 Apple Music] [▶ YouTube Music]│
│  [このセトリをベースに自分で編集]                 │
│                                                 │
│  ── 広告 ──                                     │
└─────────────────────────────────────────────────┘
```

**各曲のリンク表示（odesliで生成）**
- isrcがある曲：Spotify・Apple Music・YouTube Musicのリンクを表示
- isrcがない曲（手動入力）：リンクなし、曲名のみ表示
- MC・SE（Deezerにない）：リンクなし

**「Spotify/Apple Music/YouTube Musicで開く」ボタン**
- odesliでセトリ1曲目のリンクを生成して各サブスクアプリへ誘導

**「このセトリをベースに自分で編集」ボタン**
- URLハッシュのデータを`setlist:current`にコピー → /editor へ遷移
- ファンが自分版のセトリを作ってシェアできる

---

## 6. 環境変数

```env
# 不要（Deezer API・odesli APIともに認証不要）
NEXT_PUBLIC_APP_URL=https://setlog.yowofuru.com
```

---

## 7. 実装フェーズ（推奨順序）

### Phase A（MVP）
1. /editor：手動入力のみでセトリ作成・localStorage保存
2. ドラッグ&ドロップ並び替え（@dnd-kit/core）
3. 合計時間リアルタイム表示
4. URLハッシュ生成 → コピー機能

### Phase B（公開ページ）
5. /s：URLハッシュデコード → セトリ表示
6. 30秒プレビュー再生
7. Xシェアボタン
8. Instagram用画像生成（Canvas API）

### Phase C（Deezer + odesli連携）
9. Deezer API曲検索・自動情報取得（duration・isrc・preview_url）
10. odesliでSpotify/Apple Music/YouTube Musicリンク生成
11. 公開ページでマルチサブスクリンク表示・30秒プレビュー再生

### Phase D（仕上げ）
12. Google AdSense 組み込み（公開ページ下部のみ）
13. 「このセトリをベースに編集」機能

---

## 8. 重要な実装ノート

### Deezer API
- 検索エンドポイント：`https://api.deezer.com/search?q={query}`
- 認証不要・APIキー不要・ユーザー数制限なし・完全無料
- `duration`フィールドが秒数（整数）で直接使える
- `preview`フィールドが30秒MP3のURL（認証不要で再生可）
- `isrc`フィールドでodesliと連携
- CORS対応済みなのでクライアントから直接叩ける

### odesli API
- エンドポイント：`https://api.song.link/v1-alpha.1/links?isrc={isrc}&userCountry=JP`
- 無料枠：10リクエスト/分（公開ページ表示時に各曲分叩くので注意）
- 対策：公開ページ表示時に全曲まとめてリクエストせず、曲をクリックしたときに初めて取得（遅延取得）
- ISRCがない曲（手動入力）はodesliリクエストしない

### URLの長さ対策
- lz-stringで圧縮（`LZString.compressToEncodedURIComponent`）することで60〜70%削減
- 曲数20曲程度でもXに投稿できる長さに収まる
- `npm install lz-string` で導入、btoa/atob方式は削除

### localStorageの容量
- 上限約5MB。セトリ1件あたり約5KB、100件以上保存しない限り問題なし
- 10件を超えた古いセトリは自動削除（`setlist:history`の先頭から削除）

### Cloudflare Pagesへの移行（バズ時の保険）
- Vercel無料枠の帯域（100GB/月）を超えそうになったらCloudflare Pagesへ移行
- Next.jsのEdge Runtime対応が必要（`runtime: 'edge'`）
- 移行手順をREADMEに記載しておくこと

---

## 9. デザイン方針

- **カラー**：モノトーン（どのサブスクにも属さない独自感）
  - 背景: `#0a0a0a` / カード: `#1a1a1a` / アクセント: `#ffffff`
  - テキスト: `#ffffff`（メイン）/ `#888888`（サブ）
- **アイコン**：lucide-react（無料・商用利用OK）
  - 左上ロゴアイコン：`<ListMusic />`（セトリ＝リストのイメージ）
- **フォント**：`Geist`（Next.jsデフォルト）
- **UI**：shadcn/ui ベース、シンプルかつプロフェッショナル
- **モバイルファースト**：バンドマンはスマホで使う場面が多い

---

## 11. 著作権表示・フッター

**表示テキスト**
```
© 2026- SETLOG by Yowofuru LLC / Yoshimisiki
```

**配置場所**
- アプリのフッター（全ページ共通）
- Instagram・X用シェア画像の右下（小さめテキスト）

**フッターリンク**
- `Yowofuru LLC` → https://yowofuru.com
- `Yoshimisiki` → https://yoshimisiki.com

- **対応言語**：日本語（ja）・英語（en）
- **ライブラリ**：`next-intl`
- **言語判定**：ブラウザの `Accept-Language` ヘッダーで自動判定
- **デフォルト**：英語（en）
- **対象**：UI上の全ラベル・ボタン・プレースホルダー・エラーメッセージ

---

## 10. 将来拡張メモ（Phase 2以降）

- iOS/Androidアプリ（React Native / Expo）
- Apple Music PKCE連携（MusicKit JS）
- QRコード表示機能（ライブ会場でスクリーンに映す）
- セトリ分析（平均BPM・調性バランス）

---

## 🔒 公開しないメモ

- Spotify API制限（Developer Mode 5ユーザー上限・Premium必須）により完全移行
- Deezer APIは認証不要・制限なし・完全無料。日本のバンドの曲も概ねカバー
- odesliは無料枠10req/分。遅延取得で問題なし。将来的にAPIキー取得で枠拡大可能
- Spotify Developer Dashboardのアプリは削除 or 放置でOK
- よをふる合同会社名義でのExtended Quota申請は将来MAU25万超えたら検討
