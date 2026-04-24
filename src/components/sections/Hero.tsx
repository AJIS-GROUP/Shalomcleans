import { Sparkles } from "lucide-react"
import { BookingForm } from "./BookingForm"

export const Hero = () => {
  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 py-30 md:py-20">
      {/* Background Image with Cinematic Overlay */}
      <div className="absolute inset-0 z-0 bg-obsidian">
        <img
          src="/hero.png"
          alt="Pristine Living Room"
          className="w-full h-full object-cover scale-105 animate-[ken-burns_20s_infinite_alternate] opacity-80"
        />
        <div className="absolute inset-0 bg-linear-to-r from-pristine dark:from-obsidian via-pristine/40 dark:via-obsidian/40 to-transparent transition-colors duration-500" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-pristine dark:to-obsidian transition-colors duration-500" />
      </div>

      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Side: Editorial Content */}
        <div className="space-y-10 animate-fade-up">
          <div className="flex items-center gap-4">
            <img src="/shalomcleans.png" alt="Shalom Logo" className="w-16 h-16 object-contain brightness-0 dark:invert transition-all duration-500" />
            <div className="h-10 w-px bg-obsidian/10 dark:bg-white/10" />
            
            {/* Desktop Badge */}
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian/5 dark:bg-white/5 border border-obsidian/10 dark:border-white/10 text-[10px] uppercase tracking-[0.2em] font-bold text-obsidian dark:text-white transition-colors duration-500">
              <Sparkles size={12} className="text-obsidian/60 dark:text-white/60" />
              The New Standard
            </div>

            {/* Mobile Button */}
            <a 
              href="#book"
              className="inline-flex md:hidden items-center gap-2 px-5 py-2.5 rounded-full bg-obsidian dark:bg-white text-[10px] uppercase tracking-[0.2em] font-bold text-white dark:text-obsidian shadow-lg shadow-obsidian/20 dark:shadow-white/10 active:scale-95 transition-all duration-300"
            >
              Book Now
            </a>
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-medium tracking-tighter leading-[0.85] text-balance text-obsidian dark:text-white transition-colors duration-500">
            Restore Your <br />
            <span className="italic text-obsidian/80 dark:text-white/80 underline decoration-8 underline-offset-8 transition-colors duration-500">Sanctuary.</span>
          </h1>

          <p className="max-w-md text-xl md:text-2xl text-obsidian/80 dark:text-white/80 font-medium leading-tight text-balance transition-colors duration-500">
            We don't just scrub and sweep. we curate the tranquility of your home.
          </p>

          <div className="flex items-center gap-8 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-obsidian bg-soft-zinc dark:bg-white/10 overflow-hidden">
                  <img src={`https://picsum.photos/seed/cleaner${i}/80/80`} alt="Cleaner" />
                </div>
              ))}
            </div>
            <div className="text-sm font-semibold">
              <div className="text-obsidian dark:text-white transition-colors duration-500">Trusted by 500+</div>
              <div className="text-obsidian/40 dark:text-white/40 transition-colors duration-500">Happy Homeowners</div>
            </div>
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
