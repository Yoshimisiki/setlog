import Link from 'next/link'
import { ListMusic } from 'lucide-react'
import AppFooter from '@/components/AppFooter'

export const metadata = {
  title: 'SETLOGについて | SETLOG',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 h-14 flex items-center max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg text-primary">SETLOG</span>
        </Link>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">SETLOGについて</h1>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            SETLOGは、バンドマンがライブのセットリストを作成・共有するためのWebツールです。
            バンド名と持ち時間を入力することで、残り時間に合う曲をランダムに自動生成できます。
          </p>
          <p>
            曲・MC・SEを秒数つきで並べ、合計時間と残り時間を確認しながらセトリを組めます。
            完成したセトリはURLひとつで公開でき、ファンはSpotify・Apple Music・YouTube Music・Deezerで楽曲を検索できます。
          </p>
          <p>
            終演後のセトリ投稿画像も、アー写・フライヤー・ロゴ・フォントを組み合わせてその場で作成できます。
          </p>
          <p>
            アカウント登録不要・無料でご利用いただけます。
          </p>
          <div className="pt-4 border-t border-border">
            <p className="font-semibold text-foreground mb-1">運営</p>
            <p>
              よをふる合同会社（Yowofuru LLC）<br />
              <a href="https://yowofuru.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">https://yowofuru.com</a>
            </p>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  )
}
