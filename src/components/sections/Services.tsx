import { Home, Sparkles, Truck } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"

type Service = {
  title: string
  description: string
  icon: typeof Home
}

const services: Service[] = [
  {
    title: "Standard Cleaning",
    description:
      "Regular maintenance cleaning to keep your home pristine. Perfect for weekly or bi-weekly schedules.",
    icon: Home,
  },
  {
    title: "Deep Cleaning",
    description:
      "Thorough top-to-bottom attention for homes that deserve extra care. Every detail, every surface.",
    icon: Sparkles,
  },
  {
    title: "Move-In / Move-Out",
    description:
      "Make your old place deposit-ready or your new home flawless before you settle in.",
    icon: Truck,
  },
]

export const Services = () => {
  return (
    <section id="our-services" className="relative py-20 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="What We Offer"
          title="Our"
          titleItalic="services."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div key={service.title} className="group animate-fade-in-view">
                <div className="double-bezel rounded-4xl bg-black/2 dark:bg-white/5 p-1.5 transition-colors duration-300 hover:bg-obsidian/5 dark:hover:bg-white/10">
                  <div className="double-bezel-inner bg-pristine dark:bg-obsidian rounded-[1.625rem] p-8 md:p-10 h-full flex flex-col gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-obsidian/5 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon size={26} strokeWidth={1.25} className="text-obsidian dark:text-white" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-obsidian dark:text-white">
                        {service.title}
                      </h3>
                      <p className="text-obsidian/55 dark:text-white/55 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
