"use client"
import { motion } from "framer-motion"
import { SectionHeader } from "../ui/SectionHeader"
import { Leaf, Shield, Users } from "lucide-react"

const PillarCard = ({ icon: Icon, title, description, index }: { icon: any, title: string, description: string, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
    className="group h-full"
  >
    <div className="rounded-4xl bg-black/2 dark:bg-white/5 p-1.5 transition-all duration-700 hover:bg-obsidian/5 dark:hover:bg-white/10 h-full">
      <div className="relative bg-white dark:bg-white/5 rounded-[1.625rem] p-10 md:p-12 overflow-hidden h-full transition-colors duration-500 flex flex-col">
        {/* Ambient glow */}
        <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-serenity/10 dark:bg-serenity/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative z-10 space-y-8 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-obsidian/5 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
            <Icon size={28} strokeWidth={1} className="text-obsidian dark:text-white transition-colors duration-500" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-obsidian dark:text-white transition-colors duration-500">{title}</h3>
            <p className="text-obsidian/50 dark:text-white/50 text-lg leading-relaxed group-hover:text-obsidian/70 dark:group-hover:text-white/70 transition-colors duration-500">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)

export const Philosophy = () => {
  const pillars = [
    {
      icon: Leaf,
      title: "Zero-Toxin Mandate",
      description: "Every compound we use is 100% biodegradable and plant-derived. Your home stays safe for children, pets, and the planet—without compromising on power.",
    },
    {
      icon: Shield,
      title: "Vetted Specialists",
      description: "Our team undergoes multi-phase background verification, behavioral profiling, and 100+ hours of hands-on training before entering any client's home.",
    },
    {
      icon: Users,
      title: "Bespoke Rituals",
      description: "No two homes are alike. We design custom restoration protocols tailored to your architecture, lifestyle rhythm, and personal standards of comfort.",
    },
  ]

  const stats = [
    { value: "2,400+", label: "Homes Restored" },
    { value: "98.7%", label: "Client Retention" },
    { value: "4.9", label: "Average Rating" },
    { value: "0", label: "Toxic Chemicals" },
  ]

  return (
    <section id="about" className="pt-40 pb-20 overflow-hidden transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="The Shalom Philosophy"
          title="Cleaning is a"
          titleItalic="restorative act."
          description="Our name, Shalom, means peace and wholeness. We believe that a cluttered space leads to a cluttered mind. By restoring order to your environment, we help restore peace to your soul."
        />

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} {...pillar} index={i} />
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
          className="rounded-4xl bg-obsidian dark:bg-white p-1.5 transition-colors duration-500"
        >
          <div className="rounded-[1.625rem] bg-obsidian dark:bg-white px-8 py-16 md:py-20 transition-colors duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  className="text-center space-y-3"
                >
                  <div className="text-4xl md:text-6xl font-display font-medium tracking-tighter text-white dark:text-obsidian transition-colors duration-500">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 dark:text-obsidian/30 transition-colors duration-500">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Decorative Line - Reduced spacing */}
        <div className="flex justify-center pt-16">
          <div className="w-px h-16 bg-linear-to-b from-obsidian/20 dark:from-white/20 to-transparent" />
        </div>
      </div>
    </section>
  )
}
