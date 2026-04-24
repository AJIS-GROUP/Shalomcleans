"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, ArrowRight } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"

const FAQItem = ({ question, answer, isOpen, onClick, index }: { question: string, answer: string, isOpen: boolean, onClick: () => void, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
      className="border-b border-obsidian/5 dark:border-white/10 first:border-t transition-colors duration-500"
    >
      <button 
        onClick={onClick}
        className="w-full py-12 flex items-center justify-between text-left group gap-12"
      >
        <div className="flex items-center gap-12">
          <span className="hidden md:block text-[10px] font-bold text-obsidian/20 dark:text-white/20 tracking-[0.4em] uppercase transition-colors duration-500">0{index + 1}</span>
          <span className={`text-2xl md:text-5xl font-display font-medium tracking-tighter leading-none transition-all duration-700 ${isOpen ? 'text-obsidian dark:text-white' : 'text-obsidian/30 dark:text-white/30 group-hover:text-obsidian dark:group-hover:text-white'}`}>
            {question}
          </span>
        </div>
        <div className={`shrink-0 w-12 h-12 rounded-full border border-obsidian/5 dark:border-white/10 flex items-center justify-center transition-all duration-700 ${isOpen ? 'bg-obsidian dark:bg-white text-white dark:text-obsidian rotate-180' : 'group-hover:bg-soft-zinc dark:group-hover:bg-white/10'}`}>
          {isOpen ? <Minus size={20} strokeWidth={1} /> : <Plus size={20} strokeWidth={1} />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }}
            className="overflow-hidden"
          >
            <div className="pb-16 pl-0 md:pl-24 max-w-4xl">
              <p className="text-xl md:text-3xl text-obsidian/50 dark:text-white/50 leading-relaxed font-medium transition-colors duration-500">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What is the Shalom Standard?",
      answer: "A commitment to restoring tranquility. We don't just clear surfaces; we reset the atmosphere of your home using plant-based catalysts and precision-engineered ritual workflows.",
    },
    {
      question: "How is security handled?",
      answer: "Every specialist undergoes a multi-phase audit—including deep background verification and 100+ hours of mandatory ritual apprenticeship—to ensure the absolute sanctity of your space.",
    },
    {
      question: "Which products do you use?",
      answer: "We maintain a strict Zero-Toxin mandate. Every compound we utilize is 100% biodegradable, ethically sourced, and ecologically inert, protecting both your family and the planet.",
    },
    {
      question: "Can I customize my ritual?",
      answer: "Exclusively. We offer curated subscription memberships for weekly or monthly purifications, each tailored to the unique architectural rhythm and lifestyle of your household.",
    },
  ]

  return (
    <section className="py-40 px-6 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <SectionHeader 
          eyebrow="Common Curiosities"
          title="Clarity in every"
          titleItalic="interaction."
          description="Transparency is the foundation of tranquility. We believe that clear communication is as essential as a clean home."
        />

        <div className="max-w-7xl mx-auto">
          {faqs.map((faq, i) => (
            <FAQItem 
              key={i} 
              index={i}
              {...faq} 
              isOpen={openIndex === i} 
              onClick={() => setOpenIndex(openIndex === i ? null : i)} 
            />
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <div className="inline-flex items-center gap-6 group cursor-pointer">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-obsidian/40 dark:text-white/40 group-hover:text-obsidian dark:group-hover:text-white transition-colors">Still have questions?</span>
            <div className="w-12 h-12 rounded-full border border-obsidian/5 dark:border-white/10 flex items-center justify-center group-hover:bg-obsidian dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-obsidian transition-all duration-700">
              <ArrowRight size={18} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
