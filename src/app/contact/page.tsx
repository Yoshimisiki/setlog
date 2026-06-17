import Link from 'next/link'
import { ListMusic } from 'lucide-react'
import AppFooter from '@/components/AppFooter'

export const metadata = {
  title: 'お問い合わせ | SETLOG',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 h-14 flex items-center max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ListMusic className="w-5 h-5 text-primary" />
          <span className="font-bold text-lg text-primary">SETLOG</span>
        </Link>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h1 className="text-2xl font-bold text-foreground">お問い合わせ</h1>
        <p>
          SETLOGに関するご意見・不具合報告・その他のお問い合わせは、以下からご連絡ください。
        </p>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="font-semibold text-foreground">よをふる合同会社（Yowofuru LLC）</p>
          <p>
            Web:{' '}
            <a href="https://yowofuru.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              https://yowofuru.com
            </a>
          </p>
          <p>
            開発者:{' '}
            <a href="https://yoshimisiki.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              https://yoshimisiki.com
            </a>
          </p>
        </div>
        <p className="text-xs">返信にお時間をいただく場合があります。あらかじめご了承ください。</p>
      </main>
      <AppFooter />
    </div>
  )
}
