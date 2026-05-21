export const Footer = () => {
  return (
    <footer className="py-12 border-t border-obsidian/5 dark:border-white/10 bg-soft-zinc/20 dark:bg-white/5 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
            <img src="/shalomcleans.png" alt="Shalom Cleans Logo" className="w-full h-full brightness-0 dark:invert object-contain transition-all duration-500" />
          </div>
          <span className="font-display font-semibold tracking-tight text-obsidian dark:text-white text-sm uppercase transition-colors duration-500">Shalom Cleans</span>
        </div>
        <div className="text-xs text-obsidian/40 dark:text-white/40 font-medium tracking-widest uppercase text-center md:text-left transition-colors duration-500">
          © 2026 Shalom Cleans. Pristine Spaces, Peaceful Hearts.
        </div>
        <div className="flex items-center gap-6">
          <a href="https://www.instagram.com/shalomcleans/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-obsidian/60 dark:text-white/60 hover:text-obsidian dark:hover:text-white transition-colors">Instagram</a>
        </div>
      </div>
    </footer>
  )
}
