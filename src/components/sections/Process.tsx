import { FileText, CalendarCheck, Sparkles } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"
import { Button } from "../ui/Button"
import { BOOK_URL } from "../../lib/booking-urls"

type Step = {
  number: string
  title: string
  description: string
  icon: typeof FileText
}

const steps: Step[] = [
  {
    number: "01",
    title: "Request Your Quote",
    description: "Fill out our 30-second quote form and tell us about your home.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Choose Your Cleaning Date",
    description: "We'll send you a custom quote and confirm your preferred cleaning date.",
    icon: CalendarCheck,
  },
  {
    number: "03",
    title: "Relax in Your Spotless Home",
    description: "Our licensed professionals arrive on time and leave your home immaculate.",
    icon: Sparkles,
  },
]

export const Process = () => {
  return (
    <section id="process" className="relative py-20 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Simple Process"
          title="How it"
          titleItalic="works."
          description="From quote to clean home in three easy steps. No phone tag, no surprises — just a pristine space waiting for you."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative group animate-fade-in-view">
                <div className="double-bezel rounded-3xl bg-black/2 dark:bg-white/5 p-1.5 transition-colors duration-300 hover:bg-obsidian/5 dark:hover:bg-white/10">
                  <div className="double-bezel-inner relative bg-pristine dark:bg-obsidian rounded-[1.375rem] p-8 md:p-10 h-full overflow-hidden">
                    <div className="absolute -right-6 -top-6 text-[8rem] font-display font-bold text-obsidian/[0.03] dark:text-white/[0.04] pointer-events-none leading-none select-none">
                      {step.number}
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-obsidian/5 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon size={22} strokeWidth={1.25} className="text-obsidian dark:text-white" />
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-obsidian/30 dark:text-white/30">
                          STEP {step.number}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl md:text-2xl font-display font-medium tracking-tight text-obsidian dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-obsidian/55 dark:text-white/55 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in-view">
          <a href={BOOK_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg" withArrow>
              Get My Free Quote
            </Button>
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-obsidian/40 dark:text-white/40">
            <span>Takes 30 seconds</span>
            <span>·</span>
            <span>No obligation</span>
            <span>·</span>
            <span>Same-week availability</span>
          </div>
        </div>
      </div>
    </section>
  )
}
