import Link from 'next/link'
import { ListMusic } from 'lucide-react'
import AppFooter from '@/components/AppFooter'

export const metadata = {
  title: 'プライバシーポリシー | SETLOG',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 h-14 flex items-center max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg text-primary">SETLOG</span>
        </Link>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <h1 className="text-2xl font-bold text-foreground">プライバシーポリシー</h1>
        <p>よをふる合同会社（以下「当社」）は、SETLOG（以下「本サービス」）における個人情報の取り扱いについて、以下のとおり定めます。</p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. 収集する情報</h2>
          <p>本サービスでは、以下の情報を収集・保存することがあります。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>セトリ内容（曲名・アーティスト名・MC/SE内容など）：公開URL生成時にSupabaseへ保存されます。</li>
            <li>ブラウザのローカルストレージ：編集中のセトリ・画像カスタマイズ設定などを保存します。サーバーには送信されません。</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. 収集しない情報</h2>
          <p>本サービスにはアカウント機能がないため、以下の情報は一切収集しません。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>氏名・メールアドレス・電話番号などの個人識別情報</li>
            <li>クレジットカード番号などの決済情報</li>
            <li>パスワード</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Cookieおよび広告について</h2>
          <p>
            本サービスでは、Google AdSenseによる広告を配信しています。
            Google AdSenseは、ユーザーの興味に基づいた広告を表示するためにCookieを使用することがあります。
            Cookieの使用を無効にする場合は、ブラウザの設定を変更してください。
          </p>
          <p>
            Google による広告 Cookie の使用については、
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google のポリシー</a>
            をご確認ください。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. 外部サービスの利用</h2>
          <p>本サービスは以下の外部サービスを利用しています。各サービスのプライバシーポリシーに従って情報が処理されます。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supabase（セトリデータの保存）</li>
            <li>Vercel（Webホスティング）</li>
            <li>Google AdSense（広告配信）</li>
            <li>iTunes Search API / Deezer API / MusicBrainz（楽曲情報取得）</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">5. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、以下までご連絡ください。<br />
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
