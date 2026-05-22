import { CalendarDays, CalendarCheck, CalendarRange, Check } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"
import { Button } from "../ui/Button"
import { BOOK_URL } from "../../lib/booking-urls"

type Plan = {
  title: string
  description: string
  icon: typeof CalendarDays
  popular?: boolean
}

const plans: Plan[] = [
  {
    title: "Weekly Cleaning",
    description: "Perfect for busy families who want their home spotless all the time.",
    icon: CalendarDays,
  },
  {
    title: "Bi-Weekly Cleaning",
    description: "The ideal balance between cleanliness and cost.",
    icon: CalendarCheck,
    popular: true,
  },
  {
    title: "Monthly Cleaning",
    description: "Great for maintaining a tidy home between deep cleans.",
    icon: CalendarRange,
  },
]

const inclusions = [
  "Priority scheduling",
  "Discounted recurring rates",
  "Same trusted cleaning team",
]

export const RecurringPlans = () => {
  return (
    <section id="services" className="relative py-20 md:py-24 px-4 bg-soft-zinc/30 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Save More"
          title="Recurring"
          titleItalic="cleaning plans."
          description="Keep your home spotless without lifting a finger. Choose a cleaning schedule that works best for your home and lifestyle."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.title}
                className={`relative group animate-fade-in-view ${plan.popular ? "md:-translate-y-3" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-obsidian dark:bg-pristine text-white dark:text-obsidian text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg shadow-obsidian/20 dark:shadow-white/10">
                    Most Popular
                  </div>
                )}
                <div
                  className={`double-bezel rounded-4xl p-1.5 transition-colors duration-300 ${plan.popular
                      ? "bg-obsidian/10 dark:bg-white/15 hover:bg-obsidian/15 dark:hover:bg-white/20"
                      : "bg-black/2 dark:bg-white/5 hover:bg-obsidian/5 dark:hover:bg-white/10"
                    }`}
                >
                  <div className="double-bezel-inner relative bg-pristine dark:bg-obsidian rounded-[1.625rem] p-8 md:p-10 h-full flex flex-col gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-obsidian/5 dark:bg-white/10 flex items-center justify-center">
                      <Icon size={26} strokeWidth={1.25} className="text-obsidian dark:text-white" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-obsidian dark:text-white">
                        {plan.title}
                      </h3>
                      <p className="text-obsidian/55 dark:text-white/55 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 animate-fade-in-view">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {inclusions.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 text-sm font-medium text-obsidian/60 dark:text-white/60"
              >
                <Check size={14} className="text-obsidian/40 dark:text-white/40" />
                {item}
              </li>
            ))}
          </ul>
          <a href={BOOK_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg" withArrow>
              Get My Free Quote
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
