import { useEffect, useState } from "react"
import { submitBooking, bookingSchema } from "../../lib/actions"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { SectionHeader } from "../ui/SectionHeader"

const inputBase = "w-full px-4 py-2.5 rounded-xl bg-soft-zinc dark:bg-white/10 border-transparent focus:bg-white dark:focus:bg-white/15 focus:ring-1 focus:ring-obsidian/10 dark:focus:ring-white/20 transition-all outline-none text-sm text-obsidian dark:text-white dark:placeholder:text-white/30"
const labelBase = "text-[10px] font-bold uppercase tracking-widest text-obsidian/40 dark:text-white/40 transition-colors duration-500"

export const BookingForm = ({ isHero }: { isHero?: boolean }) => {
  const [submitted, setSubmitted] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedService, setSelectedService] = useState("Standard")

  const services = ["Standard", "Deep Clean", "Move-In/Out"]

  useEffect(() => {
    const applyPreselect = (value: string | null | undefined) => {
      if (!value) return
      if (services.includes(value)) setSelectedService(value)
    }

    try {
      const stored = sessionStorage.getItem("shalom:preselectService")
      if (stored) {
        applyPreselect(stored)
        sessionStorage.removeItem("shalom:preselectService")
      }
    } catch {}

    const onPreselect = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      applyPreselect(detail)
    }
    window.addEventListener("shalom:preselect", onPreselect)
    return () => window.removeEventListener("shalom:preselect", onPreselect)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    
    const formData = new FormData(e.currentTarget)
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      zip: formData.get('zip') as string,
      address: formData.get('address') as string,
      service: selectedService,
    }
    
    const result = bookingSchema.safeParse(rawData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsPending(true)
    try {
      await submitBooking({ data: result.data })
      setSubmitted(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrors({ root: message || "Something went wrong. Please try again." })
    } finally {
      setIsPending(false)
    }
  }

  if (submitted) {
    return (
      <div className={`text-center space-y-6 ${!isHero && 'py-32 px-4 max-w-3xl mx-auto'}`}>
        <div className="animate-fade-up flex flex-col items-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-serenity dark:bg-white/10 flex items-center justify-center text-obsidian dark:text-white">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-4xl font-display font-medium text-obsidian dark:text-white">Rest Easy.</h2>
          <p className="text-lg text-obsidian/60 dark:text-white/60">
            Your booking request has been received. We'll call you in 30 seconds.
          </p>
          <Button variant="secondary" onClick={() => setSubmitted(false)}>
            Send Another Request
          </Button>
        </div>
      </div>
    )
  }

  const formContent = (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-obsidian dark:text-white">
          Request Your Free Quote
        </h3>
        <p className="text-[10px] font-bold tracking-[0.3em] text-obsidian/40 dark:text-white/40 uppercase">
          30 Seconds · No Obligation
        </p>
      </div>

      <Card className={isHero ? 'border-obsidian/10 shadow-2xl' : ''}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelBase}>Full Name <span className="text-red-500">*</span></label>
              <input 
                name="name"
                className={`${inputBase} ${errors.name ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                placeholder="John Smith"
              />
              {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1 animate-fade-up">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelBase}>Phone <span className="text-red-500">*</span></label>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                className={`${inputBase} ${errors.phone ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                placeholder="(404) 555-1234"
              />
              {errors.phone ? (
                <p className="text-[10px] text-red-500 font-bold ml-1 animate-fade-up">{errors.phone}</p>
              ) : (
                <p className="text-[10px] text-obsidian/30 dark:text-white/30 ml-1">US numbers only · any format</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelBase}>Email <span className="text-red-500">*</span></label>
              <input
                name="email"
                type="email"
                className={`${inputBase} ${errors.email ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1 animate-fade-up">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className={labelBase}>Zip Code <span className="text-red-500">*</span></label>
              <input
                name="zip"
                className={`${inputBase} ${errors.zip ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                placeholder="30308"
              />
              {errors.zip && <p className="text-[10px] text-red-500 font-bold ml-1 animate-fade-up">{errors.zip}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelBase}>Street Address <span className="text-red-500">*</span></label>
            <input
              name="address"
              autoComplete="street-address"
              className={`${inputBase} ${errors.address ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
              placeholder="123 Peachtree St NW"
            />
            {errors.address ? (
              <p className="text-[10px] text-red-500 font-bold ml-1 animate-fade-up">{errors.address}</p>
            ) : (
              <p className="text-[10px] text-obsidian/30 dark:text-white/30 ml-1">
                We verify this against your ZIP to make sure we got it right.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className={labelBase}>Service Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {services.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => {
                    setSelectedService(service)
                    if (errors.service) setErrors(prev => ({ ...prev, service: '' }))
                  }}
                  className={`py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                    selectedService === service
                      ? 'bg-obsidian dark:bg-white text-white dark:text-obsidian border-obsidian dark:border-white'
                      : errors.service 
                        ? 'bg-red-50 dark:bg-red-500/5 border-red-500/50 text-red-500'
                        : 'bg-soft-zinc dark:bg-white/5 text-obsidian/40 dark:text-white/40 border-transparent hover:border-obsidian/10 dark:hover:border-white/10'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
            {errors.service && <p className="text-[10px] text-red-500 font-bold ml-1 animate-fade-up">{errors.service}</p>}
          </div>
          
          {errors.root && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              {errors.root}
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-obsidian/40 dark:text-white/40">
                ✦ We will call you in 30 seconds
              </span>
            </div>
            <Button 
              type="submit" 
              className="w-full py-4 text-xs tracking-[0.2em] uppercase font-bold" 
              disabled={isPending}
            >
              {isPending ? 'Sending...' : 'Get My Free Quote'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )

  if (isHero) return formContent

  return (
    <section id="book" className="relative pt-20 pb-40 px-4 overflow-hidden transition-colors duration-500">
      {/* Cinematic Background Layer - Matched to Hero */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-obsidian">
        <img 
          src="/hero.png" 
          alt="Cinematic Background" 
          className="w-full h-full object-cover opacity-60 animate-[ken-burns_30s_infinite_alternate]" 
        />
        {/* Mirror Hero Gradients */}
        <div className="absolute inset-0 bg-linear-to-r from-pristine dark:from-obsidian via-pristine/40 dark:via-obsidian/40 to-transparent transition-colors duration-500" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-pristine dark:to-obsidian transition-colors duration-500" />
        {/* Softening overlay for the "Get Started" section specifically */}
        <div className="absolute inset-0 bg-pristine/30 dark:bg-obsidian/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <SectionHeader 
          eyebrow="Get Started"
          title="Begin your"
          titleItalic="transformation."
          description="Ready to reclaim your time and peace? Our specialists are standing by to restore your home's tranquility."
        />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div className="space-y-8 pt-12">
          <div className="space-y-4">
            {[
              "Free, No-Obligation Quote",
              "Eco-Friendly Standards",
              "5-Star Guarantee"
            ].map((text) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-serenity dark:bg-white/20" />
                <span className="text-sm font-medium text-obsidian dark:text-white transition-colors duration-500">{text}</span>
              </div>
            ))}
          </div>
          <div className="p-8 rounded-3xl bg-soft-zinc/50 dark:bg-white/5 border border-obsidian/5 dark:border-white/10 transition-colors duration-500">
            <p className="text-sm text-obsidian/40 dark:text-white/40 leading-relaxed italic transition-colors duration-500">
              "We don't just clean; we restore. Every service is a commitment to your peace of mind."
            </p>
          </div>
        </div>
        {formContent}
      </div>
     </div>
    </section>
  )
}
