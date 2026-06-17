import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListMusic, Shuffle, Pin, Mic2, ImageIcon, Smartphone } from 'lucide-react'
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

      <main className="flex-1 flex flex-col items-center px-4 py-20">
        {/* Hero */}
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-medium border border-primary/20">
            <ListMusic className="w-4 h-4" />
            登録不要・無料
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            セトリ作りを、<br />
            <span className="text-primary">もっと楽しく。</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            持ち曲から、思いがけないセトリを作る。<br />
            バンド名と持ち時間を入れるだけ。曲・MC・SEを並べて、残り時間に合う曲をSETLOGが自動生成します。<br />
            <span className="text-sm">終演後のセトリ画像も、アー写・フライヤー・ロゴ・フォントを選んでそのまま作れます。</span>
          </p>

          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-10"
          >
            <Link href="/editor">セトリを作る →</Link>
          </Button>
        </div>

        {/* Features */}
        <div id="features" className="mt-24 max-w-3xl mx-auto w-full space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight">
            持ち曲から、思いがけないセトリを作る。
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Shuffle,
                title: '持ち曲でセトリを自動生成',
                desc: 'バンド名と持ち時間を入れると、残り時間に合う曲をランダムに生成。いつもと違う曲順や、思いがけない組み合わせに出会えます。',
              },
              {
                icon: Pin,
                title: '気に入った曲は固定',
                desc: '自動生成は何度でもやり直せます。残したい曲だけ固定して、あとは入れ替えるだけ。',
              },
              {
                icon: Mic2,
                title: 'MC・SEも一緒に管理',
                desc: '曲だけでなく、MCやSEも秒数込みで追加。合計時間と残り時間を見ながらセトリを組めます。',
              },
              {
                icon: ImageIcon,
                title: 'セトリ画像をその場で作成',
                desc: 'アー写・フライヤー・ロゴを使って、終演後のセトリ投稿画像を作成。フォントも選べるので、画像編集アプリを開く手間を減らせます。',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Streaming links note */}
          <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground leading-relaxed">
            公開したセトリには、Spotify・Apple Music・YouTube Music・Deezer の検索リンクを自動表示。
            気になった曲をそのまま聴いてもらえます。
          </div>

          {/* Home screen hint */}
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            <Smartphone className="w-5 h-5 text-primary shrink-0" />
            <span>共有ボタンから「ホーム画面に追加」すると、アプリのように使えます。</span>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 max-w-xl mx-auto w-full text-center space-y-5 bg-card border border-border rounded-2xl p-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            次のセトリを、ガチャってみる。
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            持ち時間を入れて、自動生成。<br />
            気に入った曲を固定して、終演後はそのまま画像で投稿できます。
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-10"
          >
            <Link href="/editor">作成する →</Link>
          </Button>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
