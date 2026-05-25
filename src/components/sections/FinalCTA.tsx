import { Button } from "../ui/Button"

export const FinalCTA = () => {
  return (
    <section className="relative py-20 md:py-24 px-4 overflow-hidden">
      {/* Subtle background image with heavy overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover opacity-30 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-linear-to-b from-pristine via-pristine/80 to-pristine dark:from-obsidian dark:via-obsidian/80 dark:to-obsidian" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 animate-fade-in-view">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-obsidian/30 dark:text-white/30">
          Get Started
        </div>

        <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tighter leading-[0.95] text-balance text-obsidian dark:text-white">
          Ready for a <br />
          <span className="italic text-obsidian/60 dark:text-white/60">spotless home?</span>
        </h2>

        <p className="text-lg md:text-xl text-obsidian/60 dark:text-white/60 leading-relaxed max-w-xl mx-auto">
          Request your complimentary quote in under 30 seconds. No spam, no hassle — just a pristine home.
        </p>

        <div className="flex flex-col items-center gap-4 pt-4">
          <a href="#quote">
            <Button variant="primary" size="lg" withArrow>
              Request Your Quote
            </Button>
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-obsidian/40 dark:text-white/40">
            <span>Mon–Sat · 9AM – 6PM</span>
            <span>·</span>
            <span>Atlanta Metro</span>
            <span>·</span>
            <span>Same-week availability</span>
          </div>
        </div>
      </div>
    </section>
  )
}
