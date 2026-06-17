import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer className="border-t border-border mt-12 py-6 px-4 text-center text-xs text-muted-foreground/60 space-y-2">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link href="/about" className="hover:text-muted-foreground transition-colors">SETLOGについて</Link>
        <Link href="/privacy" className="hover:text-muted-foreground transition-colors">プライバシーポリシー</Link>
        <Link href="/terms" className="hover:text-muted-foreground transition-colors">利用規約</Link>
        <Link href="/contact" className="hover:text-muted-foreground transition-colors">お問い合わせ</Link>
      </div>
      <div>
        © 2026– SETLOG by{' '}
        <a href="https://yowofuru.com" target="_blank" rel="noopener noreferrer"
          className="hover:text-muted-foreground underline underline-offset-2 transition-colors">
          Yowofuru LLC
        </a>
        {' / '}
        <a href="https://yoshimisiki.com" target="_blank" rel="noopener noreferrer"
          className="hover:text-muted-foreground underline underline-offset-2 transition-colors">
          Yoshimisiki
        </a>
      </div>
    </footer>
  )
}
