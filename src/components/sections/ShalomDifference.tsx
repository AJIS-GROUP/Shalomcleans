"use client"
import { motion } from "framer-motion"
import { Star, ShieldCheck, CalendarClock, MapPin } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"

const stats = [
  { icon: Star, label: "5-Star Rated" },
  { icon: ShieldCheck, label: "Licensed & Insured" },
  { icon: CalendarClock, label: "Same-Week Booking" },
  { icon: MapPin, label: "40-Mile Radius" },
]

const areas = [
  "Midtown",
  "Downtown",
  "Buckhead",
  "Brookhaven",
  "Marietta",
  "Smyrna",
  "Kennesaw",
  "Austell",
  "Acworth",
  "Woodstock",
  "Mableton",
]

export const ShalomDifference = () => {
  return (
    <section id="about" className="relative py-20 md:py-24 px-4 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Why Choose Us"
          title="The Shalom"
          titleItalic="difference."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <div className="double-bezel rounded-3xl bg-black/2 dark:bg-white/5 p-1.5 transition-all duration-700 hover:bg-obsidian/5 dark:hover:bg-white/10">
                  <div className="double-bezel-inner bg-pristine dark:bg-obsidian rounded-[1.375rem] p-6 md:p-8 flex flex-col items-center text-center gap-4 transition-colors duration-500">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-obsidian/5 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Icon size={22} strokeWidth={1.25} className="text-obsidian dark:text-white" />
                    </div>
                    <h3 className="text-sm md:text-base font-display font-medium tracking-tight text-obsidian dark:text-white transition-colors duration-500">
                      {stat.label}
                    </h3>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 md:mt-20 text-center space-y-6"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-obsidian/30 dark:text-white/30 transition-colors duration-500">
            Areas We Serve
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-2 md:gap-3 max-w-3xl mx-auto">
            {areas.map((area) => (
              <li
                key={area}
                className="px-3.5 py-1.5 rounded-full bg-obsidian/5 dark:bg-white/10 border border-obsidian/5 dark:border-white/10 text-xs font-medium text-obsidian/70 dark:text-white/70 transition-colors duration-500"
              >
                {area}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
