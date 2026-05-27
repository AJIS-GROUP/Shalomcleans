import { Link } from "@tanstack/react-router"
import { Footer } from "./Footer"

type LegalLayoutProps = {
  title: string
  effectiveDate: string
  children: React.ReactNode
}

export const LegalLayout = ({ title, effectiveDate, children }: LegalLayoutProps) => (
  <div>
    <section className="relative pt-32 pb-12 px-4 bg-soft-zinc/30 dark:bg-white/[0.02] border-b border-obsidian/5 dark:border-white/10">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.25em] text-obsidian/40 dark:text-white/40 hover:text-obsidian dark:hover:text-white transition-colors mb-6"
        >
          ← Back to home
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight text-obsidian dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-obsidian/40 dark:text-white/40">
          Effective {effectiveDate}
        </p>
      </div>
    </section>
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-8 text-obsidian/80 dark:text-white/75 leading-relaxed">
      {children}
    </main>
    <Footer />
  </div>
)

export const LegalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl md:text-2xl font-display font-medium text-obsidian dark:text-white tracking-tight">
      {title}
    </h2>
    <div className="space-y-3 text-[15px]">{children}</div>
  </section>
)
