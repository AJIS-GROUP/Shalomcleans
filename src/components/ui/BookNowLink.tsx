import type { AnchorHTMLAttributes, MouseEvent } from "react"
import { BOOK_URL } from "../../lib/booking-urls"
import { newEventId, trackPixel } from "../../lib/meta-pixel"

type BookNowLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> & {
  surface?: string
}

export const BookNowLink = ({ surface, onClick, children, ...rest }: BookNowLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackPixel("InitiateCheckout", {
      event_id: newEventId(),
      content_name: "Book Now",
      content_category: "Service Booking",
      ...(surface ? { surface } : {}),
    })
    onClick?.(event)
  }

  return (
    <a
      href={BOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  )
}
