"use client"
import { motion } from "framer-motion"
import { Card } from "../ui/Card"
import { Home, Building2, Move, ShieldCheck, Sparkles, Clock, ArrowUpRight } from "lucide-react"
import { BOOK_URL } from "../../lib/booking-urls"

/* Isolated perpetual micro-animations — one per card variant */
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-dashed border-obsidian/10 dark:border-white/10 transition-colors duration-500"
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full border border-obsidian/5 dark:border-white/5 transition-colors duration-500"
    />
  </div>
)

const RotatingGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{ rotate: [0, 90] }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%]"
    >
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute left-1/2 top-0 w-px h-full bg-obsidian/5 dark:bg-white/5 transition-colors duration-500" style={{ transform: `rotate(${i * 22.5}deg)` }} />
      ))}
    </motion.div>
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full border border-obsidian/10 dark:border-white/10 transition-colors duration-500"
    />
  </div>
)

const PulsingRings = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 3], opacity: [0.3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: i * 1.6 }}
        className="absolute w-24 h-24 rounded-full border border-obsidian/20 dark:border-white/20 transition-colors duration-500"
      />
    ))}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-obsidian/20 dark:bg-white/20 transition-colors duration-500" />
  </div>
)

const DriftingDiamonds = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[
      { size: 64, top: "15%", left: "70%", dur: 20, delay: 0 },
      { size: 32, top: "60%", left: "20%", dur: 16, delay: 2 },
      { size: 48, top: "40%", left: "80%", dur: 24, delay: 4 },
    ].map((d, i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -30, 0], rotate: [45, 135, 45], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: d.dur, repeat: Infinity, ease: "linear", delay: d.delay }}
        className="absolute border border-obsidian/10 dark:border-white/10 rounded-sm transition-colors duration-500"
        style={{ width: d.size, height: d.size, top: d.top, left: d.left }}
      />
    ))}
  </div>
)

const cardBackgrounds = [FloatingOrbs, RotatingGrid, PulsingRings, DriftingDiamonds]

export const Services = () => {
  const services = [
    {
      title: "Residential Bliss",
      description: "Our signature cleaning ritual for private sanctuaries. We restore order and serenity to every room.",
      icon: Home,
      image: "/services/residential.png",
      span: "lg:col-span-8",
      color: "bg-serenity",
      delay: 0,
    },
    {
      title: "Commercial Purity",
      description: "Workspace cleaning that prioritizes focus and professional clarity.",
      icon: Building2,
      image: "/services/commercial.png",
      span: "lg:col-span-4",
      color: "bg-obsidian/5",
      delay: 0.1,
    },
    {
      title: "Transition Clean",
      description: "Move-in/out deep cleaning for a seamless new beginning.",
      icon: Move,
      image: "/services/transition.png",
      span: "lg:col-span-4",
      color: "bg-obsidian/5",
      delay: 0.2,
    },
    {
      title: "The Deep Ritual",
      description: "An intensive, multi-phase cleaning experience for total home rejuvenation.",
      icon: Sparkles,
      image: "/services/deep.png",
      span: "lg:col-span-8",
      color: "bg-serenity",
      delay: 0.3,
    },
  ]

  const goBook = () => window.open(BOOK_URL, "_blank", "noopener,noreferrer")

  return (
    <section id="services" className="py-32 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.3em] font-bold text-obsidian/30 dark:text-white/30 transition-colors duration-500"
          >
            Service Menu
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-medium tracking-tighter text-obsidian dark:text-white transition-colors duration-500"
          >
            Curated for <br />
            <span className="italic text-obsidian/20 dark:text-white/20 transition-colors duration-500">your lifestyle.</span>
          </motion.h2>
        </div>
        <motion.p 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-md text-xl text-obsidian/50 dark:text-white/50 leading-relaxed font-medium transition-colors duration-500"
        >
          From daily maintenance to deep restorative rituals, we bring a boutique approach to every space we touch.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {services.map((service, i) => {
          const BgComponent = cardBackgrounds[i % cardBackgrounds.length]
          return (
            <motion.button
              key={service.title}
              type="button"
              onClick={goBook}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: service.delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
              className={`${service.span} group relative h-[450px] text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian/40 dark:focus-visible:ring-white/40 focus-visible:ring-offset-4 focus-visible:ring-offset-pristine dark:focus-visible:ring-offset-obsidian rounded-[inherit]`}
              aria-label={`Book ${service.title}`}
            >
              <Card
                className="h-full border-obsidian/5 dark:border-white/10 overflow-hidden transition-all duration-700 group-hover:border-obsidian/20 dark:group-hover:border-white/30 group-hover:shadow-2xl relative"
                innerClassName="flex flex-col justify-between p-10 h-full relative overflow-hidden transition-colors duration-500"
              >
                {/* Image background layer */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover opacity-30 dark:opacity-45 grayscale-[35%] saturate-[0.9] group-hover:opacity-45 dark:group-hover:opacity-60 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[2s] ease-out"
                  />
                  {/* Readability wash: softer in the middle, stronger at top & bottom where text sits */}
                  <div className="absolute inset-0 bg-linear-to-b from-white/55 via-white/10 to-white/75 dark:from-obsidian/60 dark:via-obsidian/10 dark:to-obsidian/75" />
                </div>

                {/* Animated background layer */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                  <BgComponent />
                </div>


                <div className="flex justify-between items-start relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/90 dark:bg-obsidian/90 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-obsidian/5 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <service.icon size={28} className="text-obsidian dark:text-white transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <div className="p-3 rounded-full border border-obsidian/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/80 dark:bg-obsidian/80">
                    <ArrowUpRight size={20} className="text-obsidian/40 dark:text-white/40" />
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-display font-semibold tracking-tight text-obsidian dark:text-white transition-colors duration-500">{service.title}</h3>
                  <p className="text-obsidian/60 dark:text-white/50 text-lg leading-snug max-w-sm group-hover:text-obsidian/80 dark:group-hover:text-white/70 transition-colors duration-500">
                    {service.description}
                  </p>
                  <div className="pt-6">
                    <span className="text-xs font-bold uppercase tracking-widest border-b border-obsidian/10 dark:border-white/10 pb-1 group-hover:border-obsidian/40 dark:group-hover:border-white/40 transition-colors duration-500 text-obsidian dark:text-white">
                      Explore Service
                    </span>
                  </div>
                </div>
              </Card>
            </motion.button>
          )
        })}
      </div>

      {/* Trust Badges */}
      <div className="mt-32 grid grid-cols-2 lg:grid-cols-4 gap-12 border-t border-obsidian/5 dark:border-white/10 pt-16 transition-colors duration-500">
        {[
          { icon: ShieldCheck, label: "Fully Insured" },
          { icon: Sparkles, label: "Eco-Friendly" },
          { icon: Clock, label: "On-Time" },
          { icon: ShieldCheck, label: "Expert Staff" },
        ].map((badge, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex flex-col items-center lg:items-start gap-4"
          >
            <badge.icon size={20} className="text-obsidian/20 dark:text-white/20 transition-colors duration-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-obsidian/40 dark:text-white/40 transition-colors duration-500">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
