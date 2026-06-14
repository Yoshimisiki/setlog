export default function AppFooter() {
  return (
    <footer className="border-t border-border mt-12 py-6 px-4 text-center text-xs text-muted-foreground/60">
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
    </footer>
  )
}
