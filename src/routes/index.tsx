import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '../components/sections/Hero'
import { Services } from '../components/sections/Services'
import { Testimonials } from '../components/sections/Testimonials'
import { BookingForm } from '../components/sections/BookingForm'
import { FAQ } from '../components/sections/FAQ'
import { Philosophy } from '../components/sections/Philosophy'
import { Footer } from '../components/layout/Footer'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div>
      <Hero />
      <Services />
      <Philosophy />

      <Testimonials />
      <FAQ />
      <BookingForm />
      <Footer />
    </div>
  )
}
