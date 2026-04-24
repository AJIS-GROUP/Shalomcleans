"use client"
import { motion } from "framer-motion"

interface SectionHeaderProps {
  eyebrow: string
  title: string
  titleItalic: string
  description?: string
  className?: string
}

export const SectionHeader = ({ eyebrow, title, titleItalic, description, className = "" }: SectionHeaderProps) => {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24 ${className}`}>
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[10px] uppercase tracking-[0.3em] font-bold text-obsidian/30 dark:text-white/30 transition-colors duration-500"
        >
          {eyebrow}
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-medium tracking-tighter text-obsidian dark:text-white transition-colors duration-500"
        >
          {title} <br />
          <span className="italic text-obsidian/20 dark:text-white/20">{titleItalic}</span>
        </motion.h2>
      </div>
      {description && (
        <motion.p 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-md text-xl text-obsidian/50 dark:text-white/50 leading-relaxed font-medium transition-colors duration-500"
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
