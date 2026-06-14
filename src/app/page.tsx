import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListMusic, Clock, Share2, Headphones } from 'lucide-react'
import AppFooter from '@/components/AppFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 h-14 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg tracking-tight text-primary">SETLOG</span>
        </div>
        <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/editor">セトリを作る</Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-medium border border-primary/20">
            <ListMusic className="w-4 h-4" />
            登録不要・完全無料
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            ライブの<span className="text-primary">セットリスト</span>を<br />
            URLひとつでシェア
          </h1>

          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            持ち時間に合わせてセトリを組んで、URLをファンにシェア。
            ファンは各サブスクサービスで聴き直せます。
            <br />
            <span className="text-sm">アカウント不要・データはあなたのブラウザに保存。</span>
          </p>

          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-10"
          >
            <Link href="/editor">いますぐ作る →</Link>
          </Button>
        </div>

        <div className="mt-24 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: Clock,
              title: '持ち時間管理',
              desc: '合計時間をリアルタイムで計算。持ち時間を超えると警告表示。',
            },
            {
              icon: Share2,
              title: 'URLひとつでシェア',
              desc: 'DBなし。セトリのデータはURLに入っているので、コピーして送るだけ。',
            },
            {
              icon: Headphones,
              title: 'サブスクで聴き直し',
              desc: 'Spotify・Apple Music・YouTube Music・Deezerの検索リンクを自動生成。Deezerなら30秒プレビューも再生可能。',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
