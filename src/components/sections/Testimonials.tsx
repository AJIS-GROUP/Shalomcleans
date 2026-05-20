import { Card } from "../ui/Card"
import { Star, ArrowUpRight } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"
import { Button } from "../ui/Button"

const GMB_URL = "https://www.google.com/maps/place/Shalomcleans/@33.7673845,-84.420207,17z/data=!4m6!3m5!1s0xa34626299f26ddb1:0x896633d08e796414!8m2!3d33.7673845!4d-84.420207!16s%2Fg%2F11nb6s4cvs"

export const Testimonials = () => {
  const reviews = [
    {
      author: "Sarah Jenkins",
      role: "Homeowner, Buckhead",
      content: "Shalom Cleans has truly changed my weekends. I come home and instantly feel the 'peace' they promise. The attention to detail is unmatched.",
      rating: 5,
    },
    {
      author: "Michael Chen",
      role: "Studio Manager",
      content: "Professional, punctual, and pristine. They handle our creative studio with such care. Highly recommend their commercial service.",
      rating: 5,
    },
    {
      author: "Emma Rodriguez",
      role: "New Parent",
      content: "As a new mom, keeping the house clean was impossible. Shalom Cleans has been a lifesaver. Their eco-friendly products give me peace of mind.",
      rating: 5,
    },
  ]

  return (
    <section id="reviews" className="py-20 md:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeader 
          eyebrow="Kind Words"
          title="Voices of"
          titleItalic="serenity."
          description="We take pride in the peace we bring to our clients' homes. Here is what they have to say about the Shalom experience."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <Card key={i} className="h-full">
              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} size={14} className="fill-obsidian dark:fill-white text-obsidian dark:text-white transition-colors duration-500" />
                ))}
              </div>
              <p className="text-lg italic text-obsidian/80 dark:text-white/80 mb-8 leading-relaxed transition-colors duration-500">
                "{review.content}"
              </p>
              <div>
                <div className="font-semibold text-obsidian dark:text-white transition-colors duration-500">{review.author}</div>
                <div className="text-sm text-obsidian/40 dark:text-white/40 transition-colors duration-500">{review.role}</div>
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
