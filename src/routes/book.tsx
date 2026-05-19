import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { BookingEmbed } from '../components/sections/BookingEmbed'

export const Route = createFileRoute('/book')({ component: Book })

function Book() {
  return (
    <div className="relative">
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 dark:bg-obsidian/85 backdrop-blur-md border border-obsidian/10 dark:border-white/10 text-xs font-bold uppercase tracking-[0.2em] text-obsidian dark:text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
      >
        <ArrowLeft size={14} />
        Back
      </Link>
      <BookingEmbed kind="booknow" title="Book a cleaning with Shalom Cleans" />
    </div>
  )
}
