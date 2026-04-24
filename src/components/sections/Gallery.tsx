"use client"
import { motion } from "framer-motion"
import { SectionHeader } from "../ui/SectionHeader"

type GalleryImage = {
  src: string
  alt: string
  category: string
  aspect: string
}

// Temporary placeholders. Replace each `src` with real photos dropped into
// /public/gallery/ (e.g. "/gallery/residential-01.jpg") once the shoot is in.
const columns: GalleryImage[][] = [
  [
    {
      src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
      alt: "Sunlit living room restored after a full service",
      category: "Residential",
      aspect: "aspect-[4/5]",
    },
    {
      src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
      alt: "Freshly made bed and clear nightstand",
      category: "Residential",
      aspect: "aspect-square",
    },
    {
      src: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80",
      alt: "Polished quartz kitchen counter",
      category: "Deep Ritual",
      aspect: "aspect-[3/4]",
    },
  ],
  [
    {
      src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80",
      alt: "Spotless bathroom with chrome fixtures",
      category: "Deep Ritual",
      aspect: "aspect-[3/4]",
    },
    {
      src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
      alt: "Empty apartment ready for handover",
      category: "Move-In / Out",
      aspect: "aspect-[4/5]",
    },
    {
      src: "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?auto=format&fit=crop&w=900&q=80",
      alt: "Vacuumed hardwood living floor",
      category: "Residential",
      aspect: "aspect-square",
    },
  ],
  [
    {
      src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
      alt: "Clear modern workspace at dawn",
      category: "Commercial",
      aspect: "aspect-square",
    },
    {
      src: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=900&q=80",
      alt: "Kitchen island, fully reset",
      category: "Deep Ritual",
      aspect: "aspect-[4/5]",
    },
    {
      src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
      alt: "Clean glass meeting room",
      category: "Commercial",
      aspect: "aspect-[3/4]",
    },
  ],
  [
    {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
      alt: "Minimalist bedroom reset",
      category: "Residential",
      aspect: "aspect-[3/4]",
    },
    {
      src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
      alt: "Bright kitchen after a move-out clean",
      category: "Move-In / Out",
      aspect: "aspect-square",
    },
    {
      src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80",
      alt: "Lobby interior ready for opening",
      category: "Commercial",
      aspect: "aspect-[4/5]",
    },
  ],
]

export const Gallery = () => {
  return (
    <section id="gallery" className="py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="The Work"
          title="Rooms we have"
          titleItalic="returned to peace."
          description="A quiet selection from private homes, workspaces, and transition cleans — photographed at the end of service, exactly as our clients receive them."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {columns.map((column, colIdx) => (
            <div key={colIdx} className="grid gap-4 md:gap-6 content-start">
              {column.map((image, i) => (
                <motion.figure
                  key={image.src}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    delay: (colIdx * 0.08) + (i * 0.06),
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1] as any,
                  }}
                  className="group relative overflow-hidden rounded-3xl bg-obsidian/5 dark:bg-white/5 transition-colors duration-500"
                >
                  <div className={`${image.aspect} w-full`}>
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-obsidian/70 via-obsidian/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <figcaption className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                      {image.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                      Restored
                    </span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
          className="mt-20 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-obsidian/5 dark:border-white/10 pt-10"
        >
          <p className="text-obsidian/50 dark:text-white/50 text-lg font-medium max-w-md leading-relaxed">
            Every photo above is a real space, returned to stillness by our team.
          </p>
          <a
            href="#book"
            className="group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-obsidian dark:text-white border-b border-obsidian/20 dark:border-white/20 pb-1 hover:border-obsidian dark:hover:border-white transition-colors duration-500"
          >
            Commission your own restoration
            <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
