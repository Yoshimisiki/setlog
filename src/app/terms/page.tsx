import Link from 'next/link'
import { ListMusic } from 'lucide-react'
import AppFooter from '@/components/AppFooter'

export const metadata = {
  title: '利用規約 | SETLOG',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 h-14 flex items-center max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg text-primary">SETLOG</span>
        </Link>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <h1 className="text-2xl font-bold text-foreground">利用規約</h1>
        <p>本規約は、よをふる合同会社（以下「当社」）が提供するSETLOG（以下「本サービス」）の利用条件を定めるものです。</p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. 利用について</h2>
          <p>本サービスはバンドマン・アーティストのセトリ作成・共有を目的としたWebツールです。登録不要・無料でご利用いただけます。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. 禁止事項</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスのサーバーやネットワークに過度の負荷をかける行為</li>
            <li>他のユーザーまたは第三者の権利を侵害する行為</li>
            <li>本サービスを商業目的で無断利用・転用する行為</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. 免責事項</h2>
          <p>
            当社は、本サービスの正確性・完全性・継続性について保証しません。
            本サービスの利用により生じた損害について、当社は一切の責任を負いません。
            自動生成される楽曲情報は外部APIによるものであり、内容の正確性を保証しません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. 知的財産権</h2>
          <p>本サービスのデザイン・コード・コンテンツに関する知的財産権は当社に帰属します。ユーザーが入力したセトリデータはユーザー自身に帰属します。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">5. 規約の変更</h2>
          <p>当社は必要に応じて本規約を変更できるものとします。変更後の規約は本ページに掲載した時点で効力を生じます。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">6. お問い合わせ</h2>
          <p>
            よをふる合同会社（Yowofuru LLC）<br />
            <a href="https://yowofuru.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">https://yowofuru.com</a>
          </p>
        </section>

        <p className="text-xs">最終更新: 2026年6月</p>
      </main>
      <AppFooter />
    </div>
  )
}
