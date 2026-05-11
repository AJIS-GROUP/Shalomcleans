import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { CalendarCheck, ExternalLink } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import { Reveal } from "#/components/admin/Reveal"

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsPage,
})

function BookingsPage() {
  const bookings = useQuery(api.admin.listBookings, { limit: 200 })
  const totalLeads = useQuery(api.admin.overview)

  const conversion = totalLeads?.conversion.value ?? 0

  return (
    <>
      <Reveal>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">Bookings</h1>
          <p className="text-sm text-white/40 mt-1">
            Leads that were confirmed through Vapi → Make → BookingKoala.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="Confirmed" value={String(bookings?.length ?? "—")} />
          <Stat label="Conversion" value={`${conversion.toFixed(1)}%`} accent />
        </div>
      </div>
      </Reveal>

      <Reveal delay={0.1}>
      <div className="rounded-3xl bg-[#101012] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-white/40 text-xs">
              <tr>
                <Th>Customer</Th>
                <Th>Service</Th>
                <Th>ZIP</Th>
                <Th>BookingKoala</Th>
                <Th>Vapi call</Th>
                <Th>Booked at</Th>
              </tr>
            </thead>
            <tbody>
              {bookings === undefined && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-white/30 text-xs">
                    Loading…
                  </td>
                </tr>
              )}
              {bookings?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30 text-xs">
                    <div className="inline-flex items-center gap-2">
                      <CalendarCheck size={14} className="text-white/40" /> No
                      bookings yet — when Vapi calls succeed they'll land here.
                    </div>
                  </td>
                </tr>
              )}
              {bookings?.map((b) => (
                <tr key={b._id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <Td>
                    <div className="text-white">{b.name}</div>
                    <div className="text-[10px] text-white/40">
                      {b.email} · {b.phone}
                    </div>
                  </Td>
                  <Td><span className="text-white/80">{b.service}</span></Td>
                  <Td><span className="text-white/80">{b.zip}</span></Td>
                  <Td>
                    {b.bookingKoalaId ? (
                      <span className="font-mono text-xs text-[#c4f54a]">
                        {b.bookingKoalaId}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30">
                        no id returned
                      </span>
                    )}
                  </Td>
                  <Td>
                    {b.vapiCallId ? (
                      <span className="font-mono text-[10px] text-white/50">
                        {b.vapiCallId.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-white/50 text-xs">
                      {new Date(b._creationTime).toLocaleString()}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </Reveal>

      {bookings && bookings.length > 0 && (
        <div className="mt-4 text-xs text-white/40 inline-flex items-center gap-1.5">
          <ExternalLink size={12} /> Booking detail lives in BookingKoala — the
          ID above is what Make returned.
        </div>
      )}
    </>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-2.5 ${
        accent
          ? "bg-[#c4f54a] text-black"
          : "bg-white/5 border border-white/5 text-white"
      }`}
    >
      <div className={`text-[10px] uppercase tracking-wide ${accent ? "text-black/60" : "text-white/40"}`}>
        {label}
      </div>
      <div className="text-lg font-display">{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-normal">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>
}
