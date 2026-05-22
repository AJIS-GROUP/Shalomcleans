import { Link } from '@tanstack/react-router'
import { Menu, X, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BOOK_URL, CONTACT_URL } from '../../lib/booking-urls'

type NavLink = {
  label: string
  to?: string
  href?: string
  primary?: boolean
}

const navLinks: NavLink[] = [
  { label: 'Services', to: '/#services' },
  { label: 'How It Works', to: '/#process' },
  { label: 'About', to: '/#about' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'Contact', href: CONTACT_URL },
  { label: 'Book Now', href: BOOK_URL, primary: true },
]

const linkClass = (primary?: boolean) =>
  `inline-flex items-center gap-1.5 text-sm font-medium ${primary
    ? 'bg-obsidian dark:bg-pristine text-white dark:text-obsidian px-7 py-3 rounded-xl transition-transform duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-obsidian/10 dark:shadow-white/10'
    : 'text-obsidian/60 dark:text-white/60 transition-colors duration-200 hover:text-obsidian dark:hover:text-white'
  }`

const renderLinkInner = (link: NavLink) => (
  <>
    {link.primary && <Sparkles size={14} className="opacity-80" />}
    {link.label}
  </>
)

const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
  <>
    {navLinks.map((link) =>
      link.href ? (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onLinkClick}
          className={linkClass(link.primary)}
        >
          {renderLinkInner(link)}
        </a>
      ) : (
        <Link
          key={link.label}
          to={link.to}
          onClick={onLinkClick}
          className={linkClass(link.primary)}
        >
          {renderLinkInner(link)}
        </Link>
      )
    )}
  </>
)

const Logo = ({ withWordmark }: { withWordmark?: boolean }) => (
  <Link to="/" className="flex items-center gap-3 group">
    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
      <img
        src="/shalomcleans.webp"
        alt="Shalom Cleans Logo"
        width="40"
        height="40"
        className="w-full h-full brightness-0 dark:invert object-contain"
      />
    </div>
    {withWordmark && (
      <span className="font-display font-semibold tracking-tight text-obsidian dark:text-white text-sm uppercase">
        Shalom Cleans
      </span>
    )}
  </Link>
)

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Static full-width header — absolute, overlays the hero so its image extends to the top */}
      <div
        className={`absolute inset-x-0 top-10 z-30 transition-opacity duration-300 ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo withWordmark />

          <div className="hidden md:flex items-center gap-5">
            <NavLinks />
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-obsidian dark:text-white hover:bg-obsidian/5 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Fixed compact pill — appears once scrolled past the banner */}
      <nav
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl px-6 py-3 glass-pill rounded-2xl flex items-center justify-between ease-fluid ${isScrolled
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
      >
        <Logo />

        <div className="hidden md:flex items-center gap-4">
          <NavLinks />
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-obsidian dark:text-white hover:bg-obsidian/5 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-pristine dark:bg-obsidian transition-opacity duration-300 ease-fluid md:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, i) =>
            link.href ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className={`text-3xl font-display font-medium text-obsidian dark:text-white ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={`text-3xl font-display font-medium text-obsidian dark:text-white ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                  }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </>
  )
}
