import { Card } from "../ui/Card"
import { Star, ArrowUpRight } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"
import { Button } from "../ui/Button"

const GMB_URL = "https://www.google.com/maps/place/Shalomcleans/@33.7673845,-84.420207,17z/data=!4m6!3m5!1s0xa34626299f26ddb1:0x896633d08e796414!8m2!3d33.7673845!4d-84.420207!16s%2Fg%2F11nb6s4cvs"

export const Testimonials = () => {
  const reviews = [
    {
      author: "Anthony Jean",
      role: "a week ago",
      content: "I had an amazing experience with this cleaning company! They were on time, professional, and paid attention to every little detail. My place looked and smelled incredible when they were done — honestly better than I expected. The team was super friendly and easy to work with, and they made the whole process smooth from start to finish. You can tell they actually care about the quality of their work.",
      rating: 5,
    },
    {
      author: "Oke Ogheneroro David",
      role: "2 weeks ago",
      content: "I don't usually write reviews, but I had to for Shalomcleans. They came through and honestly exceeded my expectations. Very professional, on time, and the attention to detail was impressive. You can tell they actually care about the work they do and not just rushing to finish. I definitely recommend them.",
      rating: 5,
    },
    {
      author: "Tosin Emiola",
      role: "a day ago",
      content: "ShalomCleans is amazing! They're always on time, very professional, and do a super thorough job. My house looks and feels spotless every time they come. The team is friendly, respectful, and pays attention to detail. Highly recommend!",
      rating: 5,
    },
  ]

  return (
    <section id="reviews" className="py-20 md:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader
          eyebrow="Google Reviews"
          title="Five-star"
          titleItalic="service."
          description="Don't take our word for it — here's what Atlanta homeowners have to say about Shalomcleans on Google."
        />

        {/* Rating summary */}
        <div className="-mt-12 mb-12 flex flex-wrap items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((j) => (
              <Star key={j} size={18} className="fill-obsidian dark:fill-white text-obsidian dark:text-white" />
            ))}
          </div>
          <span className="font-display text-2xl font-medium text-obsidian dark:text-white">5.0</span>
          <span className="text-obsidian/50 dark:text-white/50">· Based on 35 reviews on Google</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <Card key={i} className="h-full">
              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} size={14} className="fill-obsidian dark:fill-white text-obsidian dark:text-white" />
                ))}
              </div>
              <p className="text-base text-obsidian/80 dark:text-white/80 mb-8 leading-relaxed">
                "{review.content}"
              </p>
              <div>
                <div className="font-semibold text-obsidian dark:text-white">{review.author}</div>
                <div className="text-sm text-obsidian/40 dark:text-white/40">{review.role}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a href={GMB_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="md">
              Write a Review
              <ArrowUpRight size={14} className="ml-1 opacity-70" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
