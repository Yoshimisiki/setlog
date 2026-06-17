'use client'

import { useTranslations } from 'next-intl'

export default function EditorGuideContent() {
  const t = useTranslations()
  const isJa = t('common.appName') === 'SETLOG' // 言語に依存しない共通キーで判定不要、直接テキストで書く

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5 text-sm">
      <h2 className="text-lg font-semibold text-foreground">SETLOGでできること</h2>

      <p className="text-muted-foreground leading-relaxed">
        SETLOGは、ライブのセトリ作成と共有を簡単にするためのツールです。曲、MC、SEを秒数つきで並べることで、合計時間と残り時間を見ながらセトリを組めます。
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground mb-1">持ち曲からセトリを自動生成</h3>
          <p className="text-muted-foreground leading-relaxed">
            バンド名を入力すると、残り時間に合う曲をランダムに追加できます。自動生成は何度でもやり直せるので、いつもと違う曲順や思いがけない組み合わせを試せます。
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-1">気に入った曲は固定</h3>
          <p className="text-muted-foreground leading-relaxed">
            自動生成された曲は、固定すると次回の生成でも残せます。固定曲、MC、SEはそのままに、残りの曲だけを入れ替えられます。
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-1">セトリ画像を作成</h3>
          <p className="text-muted-foreground leading-relaxed">
            完成したセトリは、アー写・フライヤー・ロゴ・フォントを使ってSNS用画像にできます。終演後のセトリ投稿画像をその場で作れます。
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-1">公開URLと検索リンク</h3>
          <p className="text-muted-foreground leading-relaxed">
            公開したセトリには、Spotify、Apple Music、YouTube Music、Deezer の検索リンクが表示されます。気になった曲をすぐ探してもらえます。
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-1">ホーム画面に追加</h3>
          <p className="text-muted-foreground leading-relaxed">
            iPhoneでは、Safariの共有ボタンから「ホーム画面に追加」すると、SETLOGをアプリのように起動できます。
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-foreground mb-1">注意事項</h3>
          <p className="text-muted-foreground leading-relaxed">
            自動生成される曲は、取得できる楽曲情報をもとにランダムに選ばれます。曲順や選曲が必ず最適になるわけではありません。必要に応じて手動で追加・編集してください。
          </p>
        </div>
      </div>
    </div>
  )
}
