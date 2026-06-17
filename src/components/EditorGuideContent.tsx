'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const sections = [
  {
    value: 'generate',
    title: '持ち曲からセトリを自動生成',
    body: 'バンド名を入力すると、残り時間に合う曲をランダムに追加できます。自動生成は何度でもやり直せるので、いつもと違う曲順や思いがけない組み合わせを試せます。',
  },
  {
    value: 'pin',
    title: '気に入った曲は固定',
    body: '自動生成された曲は、固定すると次回の生成でも残せます。固定曲、MC、SEはそのままに、残りの曲だけを入れ替えられます。',
  },
  {
    value: 'image',
    title: 'セトリ画像を作成',
    body: '完成したセトリは、アー写・フライヤー・ロゴ・フォントを使ってSNS用画像にできます。終演後のセトリ投稿画像をその場で作れます。',
  },
  {
    value: 'share',
    title: '公開URLと検索リンク',
    body: '公開したセトリには、Spotify、Apple Music、YouTube Music、Deezer の検索リンクが表示されます。気になった曲をすぐ探してもらえます。',
  },
  {
    value: 'pwa',
    title: 'ホーム画面に追加',
    body: 'iPhoneでは、Safariの共有ボタンから「ホーム画面に追加」すると、SETLOGをアプリのように起動できます。',
  },
  {
    value: 'note',
    title: '注意事項',
    body: '自動生成される曲は、取得できる楽曲情報をもとにランダムに選ばれます。曲順や選曲が必ず最適になるわけではありません。必要に応じて手動で追加・編集してください。',
  },
]

export default function EditorGuideContent() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
      <h2 className="text-lg font-semibold text-foreground">SETLOGでできること</h2>
      <p className="text-muted-foreground leading-relaxed">
        SETLOGは、ライブのセトリ作成と共有を簡単にするためのツールです。曲、MC、SEを秒数つきで並べることで、合計時間と残り時間を見ながらセトリを組めます。
      </p>

      <Accordion type="multiple" className="w-full">
        {sections.map(({ value, title, body }) => (
          <AccordionItem key={value} value={value} className="border-border">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-3">
              {title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-3">
              {body}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
