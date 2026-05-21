import { useRef } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { BookingForm } from "./BookingForm"
import { BOOK_URL } from "../../lib/booking-urls"

export const Hero = () => {
  const navigate = useNavigate()
  const clicks = useRef(0)
  const lastClickAt = useRef(0)

  const handleSecretClick = () => {
    const now = Date.now()
    if (now - lastClickAt.current > 800) clicks.current = 0
    lastClickAt.current = now
    clicks.current += 1
    if (clicks.current >= 3) {
      clicks.current = 0
      navigate({ to: "/admin" })
    }
  }

  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 pt-20 pb-20 md:pb-20">
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 z-0 bg-obsidian">
        <img
          src="/hero.webp"
          alt="Pristine Living Room"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover scale-105 animate-[ken-burns_20s_infinite_alternate] motion-reduce:animate-none opacity-80 will-change-transform"
        />
        <div className="absolute inset-0 bg-linear-to-r from-pristine dark:from-obsidian via-pristine/40 dark:via-obsidian/40 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-pristine dark:to-obsidian" />
      </div>

      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Side: Editorial Content */}
        <div className="space-y-10 animate-fade-up">
          <div className="flex items-center gap-4">
            <img src="/shalomcleans.webp" alt="Shalom Logo" width="96" height="96" className="w-24 h-24 object-contain brightness-0 dark:invert" />
            <div className="h-10 w-px bg-obsidian/10 dark:bg-white/10" />

            {/* Desktop Badge — secret admin trigger: 3 quick clicks */}
            <button
              type="button"
              onClick={handleSecretClick}
              aria-label="Shalom Cleans signature mark"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian/5 dark:bg-white/5 border border-obsidian/10 dark:border-white/10 text-[10px] uppercase tracking-[0.2em] font-bold text-obsidian dark:text-white cursor-default select-none"
            >
              <Sparkles size={12} className="text-obsidian/60 dark:text-white/60" />
              Premium Residential Cleaning
            </button>

            {/* Mobile Button */}
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex md:hidden items-center gap-2 px-5 py-2.5 rounded-full bg-obsidian dark:bg-pristine text-[10px] uppercase tracking-[0.2em] font-bold text-white dark:text-obsidian shadow-lg shadow-obsidian/20 dark:shadow-white/10 active:scale-95 transition-transform duration-150"
            >
              Book Now
            </a>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tighter leading-[0.9] text-balance text-obsidian dark:text-white">
            Professional House Cleaning in Atlanta <br />
            <span className="italic text-obsidian/60 dark:text-white/60">Get your free quote in 30 seconds.</span>
          </h1>

          <p className="max-w-md text-lg md:text-xl text-obsidian/70 dark:text-white/70 font-medium leading-relaxed text-balance">
            Standard, Deep Clean & Move-In/Move-Out services across Midtown, Buckhead, Marietta & beyond. Trusted by discerning Atlanta homeowners.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-2">
            {["Licensed & Insured", "Same-Week Availability", "Satisfaction Guarantee"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-obsidian/70 dark:text-white/70"
              >
                <Sparkles size={12} className="text-obsidian/40 dark:text-white/40" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian/5 dark:bg-white/10 border border-obsidian/10 dark:border-white/10 text-[11px] font-semibold tracking-wide text-obsidian/70 dark:text-white/70">
              Mon–Sat · 9AM – 6PM
            </span>
            <span className="text-[11px] text-obsidian/40 dark:text-white/40">
              · Atlanta Metro · 40-mile radius
            </span>
          </div>
        </div>

        {/* Right Side: Integrated Booking Card */}
        <div className="animate-fade-up [animation-delay:400ms]">
          <BookingForm isHero />
        </div>
      </div>
    </section>
  )
}
