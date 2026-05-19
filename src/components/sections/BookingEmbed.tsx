type Kind = "booknow" | "contact"

const PATHS: Record<Kind, string> = {
  booknow: "/booknow",
  contact: "/contact-us",
}

export const BookingEmbed = ({ kind, title }: { kind: Kind; title: string }) => {
  const src = `https://shalomcleans.bookingkoala.com${PATHS[kind]}?embed=true`
  return (
    <iframe
      src={src}
      title={title}
      className="block w-screen h-dvh border-0 bg-pristine dark:bg-obsidian"
      allow="payment *; clipboard-write *"
    />
  )
}
