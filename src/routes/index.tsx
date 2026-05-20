import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '../components/sections/Hero'
import { RecurringPlans } from '../components/sections/RecurringPlans'
import { Testimonials } from '../components/sections/Testimonials'
import { Process } from '../components/sections/Process'
import { ShalomDifference } from '../components/sections/ShalomDifference'
import { InstagramFeed } from '../components/sections/InstagramFeed'
import { BookingForm } from '../components/sections/BookingForm'
import { FinalCTA } from '../components/sections/FinalCTA'
import { Footer } from '../components/layout/Footer'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div>
      <Hero />
      <RecurringPlans />
      <Testimonials />
      <Process />
      <ShalomDifference />
      <InstagramFeed />
      <BookingForm />
      <FinalCTA />
      <Footer />
    </div>
  )
}
