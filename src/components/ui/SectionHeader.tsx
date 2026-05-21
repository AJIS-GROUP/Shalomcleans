interface SectionHeaderProps {
  eyebrow: string
  title: string
  titleItalic: string
  description?: string
  className?: string
}

export const SectionHeader = ({ eyebrow, title, titleItalic, description, className = "" }: SectionHeaderProps) => {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24 animate-fade-in-view ${className}`}>
      <div className="space-y-6">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-obsidian/30 dark:text-white/30">
          {eyebrow}
        </div>
        <h2 className="text-5xl md:text-7xl font-display font-medium tracking-tighter text-obsidian dark:text-white">
          {title} <br />
          <span className="italic text-obsidian/20 dark:text-white/20">{titleItalic}</span>
        </h2>
      </div>
      {description && (
        <p className="max-w-md text-xl text-obsidian/50 dark:text-white/50 leading-relaxed font-medium">
          {description}
        </p>
      )}
    </div>
  )
}
