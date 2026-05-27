import { Sparkles } from "lucide-react"
import { BookNowLink } from "../ui/BookNowLink"

export const PromoBanner = () => {
  return (
    <div className="relative z-30 w-full bg-obsidian dark:bg-pristine text-white dark:text-obsidian">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-center gap-3 text-center">
        <Sparkles size={12} className="hidden sm:inline-block opacity-60" />
        <p className="text-[11px] sm:text-xs font-medium tracking-wide">
          Book Today & Receive{" "}
          <span className="font-bold text-serenity dark:text-obsidian/100 mx-1">30% Off</span>
          Your Next Cleaning
        </p>
        <BookNowLink
          surface="promo-banner"
          className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full bg-white/10 dark:bg-obsidian/10 hover:bg-white/20 dark:hover:bg-obsidian/20 text-[10px] uppercase tracking-[0.18em] font-bold transition-colors"
        >
          Book Now
        </BookNowLink>
        <Sparkles size={12} className="hidden sm:inline-block opacity-60" />
      </div>
    </div>
  )
}
