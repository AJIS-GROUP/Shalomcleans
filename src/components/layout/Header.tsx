"use client"
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Services', to: '/#services' },
    { label: 'Gallery', to: '/#gallery' },
    { label: 'About', to: '/#about' },
    { label: 'Reviews', to: '/#reviews' },
    { label: 'Contact', to: '/contact' },
    { label: 'Book Now', to: '/book', primary: true },
  ]

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl px-6 py-3 glass-pill rounded-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
            <img src="/shalomcleans.png" alt="Shalom Cleans Logo" className="w-full h-full brightness-0 dark:invert object-contain transition-all duration-500" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`text-sm font-medium transition-all duration-300 ${link.primary
                ? 'bg-obsidian dark:bg-white text-white dark:text-obsidian px-5 py-2 rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-obsidian/10 dark:shadow-white/10'
                : 'text-obsidian/60 dark:text-white/60 hover:text-obsidian dark:hover:text-white hover:-translate-y-px'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-obsidian dark:text-white hover:bg-obsidian/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-white/90 dark:bg-obsidian/90 backdrop-blur-2xl transition-all duration-700 ease-fluid md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, i) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className={`text-3xl font-display font-medium text-obsidian dark:text-white transition-all duration-500 ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
