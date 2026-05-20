"use client"
import { motion } from "framer-motion"
import { Instagram, ArrowUpRight } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"
import { Button } from "../ui/Button"

const PROFILE_URL = "https://www.instagram.com/shalomcleans/"

type Post = {
  label: string
  gradient: string
}

const posts: Post[] = [
  {
    label: "Deep Cleans",
    gradient: "from-amber-500/30 via-orange-500/20 to-rose-500/30",
  },
  {
    label: "Move-Out Cleans",
    gradient: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
  },
  {
    label: "Before & Afters",
    gradient: "from-violet-500/30 via-fuchsia-500/20 to-pink-500/30",
  },
]

export const InstagramFeed = () => {
  return (
    <section id="instagram" className="relative py-20 md:py-24 px-4 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="@shalomcleans"
          title="See our"
          titleItalic="latest projects."
          description="Follow along for satisfying transformations, cleaning tips, and behind-the-scenes looks at our work across Atlanta."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {posts.map((post, i) => (
            <motion.a
              key={post.label}
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group block"
            >
              <div className="double-bezel rounded-3xl bg-black/2 dark:bg-white/5 p-1.5 transition-all duration-700 hover:bg-obsidian/5 dark:hover:bg-white/10">
                <div className={`double-bezel-inner relative aspect-square rounded-[1.375rem] overflow-hidden bg-linear-to-br ${post.gradient} transition-colors duration-500`}>
                  <div className="absolute inset-0 bg-obsidian/40 dark:bg-obsidian/50 transition-colors duration-500" />

                  <div className="relative z-10 h-full flex flex-col justify-between p-8">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                        <Instagram size={22} strokeWidth={1.5} className="text-white" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <ArrowUpRight size={18} className="text-white" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60">
                        On Instagram
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-white">
                        {post.label}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex justify-center"
        >
          <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="lg">
              <Instagram size={16} className="mr-1" />
              Follow Us on Instagram
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
