"use client"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Search, Sparkles, ShieldCheck, Heart, ArrowRight } from "lucide-react"

const StepCard = ({ number, title, description, icon: Icon, index }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="double-bezel rounded-4xl bg-black/2 dark:bg-white/5 p-1.5 transition-all duration-700 hover:bg-obsidian/5 dark:hover:bg-white/10">
        <div className="double-bezel-inner relative bg-white dark:bg-obsidian rounded-[1.625rem] p-12 overflow-hidden transition-colors duration-500">
          <div className="absolute -right-8 -top-8 text-[12rem] font-display font-bold text-obsidian/2 dark:text-white/2 pointer-events-none group-hover:text-obsidian/4 dark:group-hover:text-white/4 transition-colors duration-700">
            {number}
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-16 h-16 rounded-2xl bg-obsidian/5 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
              <Icon size={32} strokeWidth={1} className="text-obsidian dark:text-white transition-colors duration-500" />
            </div>
            
            <div className="mt-24 space-y-4">
              <div className="text-[10px] font-bold tracking-[0.3em] text-obsidian/30 dark:text-white/30 transition-colors duration-500">PHASE {number}</div>
              <h3 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-obsidian dark:text-white transition-colors duration-500">{title}</h3>
              <p className="text-obsidian/50 dark:text-white/50 text-lg leading-relaxed max-w-sm group-hover:text-obsidian/70 dark:group-hover:text-white/70 transition-colors duration-500">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const Process = () => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const steps = [
    {
      number: "01",
      title: "The Consultation",
      description: "A deep audit of your architecture to identify points of sensory and spatial tension.",
      icon: Search,
    },
    {
      number: "02",
      title: "The Purification",
      description: "Methodical removal of impurities using organic, plant-based catalysts and rituals.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "The Restoration",
      description: "Bespoke finishes applied to every surface to reset the home's original aesthetic flow.",
      icon: ShieldCheck,
    },
    {
      number: "04",
      title: "The Serenity",
      description: "You return to a sanctuary that is physically pristine and emotionally resonant.",
      icon: Heart,
    },
  ]

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <section ref={containerRef} className="relative py-40 bg-transparent overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] noise-overlay" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          
          {/* Sticky Left Content */}
          <div className="lg:sticky lg:top-40 space-y-12">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian/5 dark:bg-white/10 border border-obsidian/5 dark:border-white/10 text-[10px] uppercase tracking-[0.3em] font-bold text-obsidian/40 dark:text-white/40 transition-colors duration-500"
              >
                The Protocol
              </motion.div>
              <h2 className="text-6xl md:text-8xl font-display font-medium tracking-tighter leading-[0.9] text-obsidian dark:text-white transition-colors duration-500">
                A ritual <br />
                <span className="italic text-obsidian/20 dark:text-white/20 transition-colors duration-500">re-imagined.</span>
              </h2>
            </div>
            
            <p className="text-xl text-obsidian/50 dark:text-white/50 leading-relaxed font-medium max-w-md transition-colors duration-500">
              We've dismantled the traditional cleaning checklist and replaced it with a multi-phase restoration architecture.
            </p>

            <div className="pt-8">
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-obsidian dark:text-white group cursor-pointer w-max transition-colors duration-500">
                <span>Download the Full Guide</span>
                <div className="w-10 h-10 rounded-full bg-obsidian/5 dark:bg-white/10 flex items-center justify-center group-hover:bg-obsidian dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-obsidian transition-all duration-500">
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling Right Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div style={{ y: y1 }} className="space-y-8">
              <StepCard {...steps[0]} index={0} />
              <StepCard {...steps[2]} index={2} />
            </motion.div>
            <motion.div style={{ y: y2 }} className="space-y-8 mt-12 md:mt-24">
              <StepCard {...steps[1]} index={1} />
              <StepCard {...steps[3]} index={3} />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
