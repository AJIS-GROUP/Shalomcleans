import type { ReactNode } from "react"

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const style = delay ? { animationDelay: `${delay}s` } : undefined
  return (
    <div
      className={`animate-fade-up motion-reduce:animate-none${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </div>
  )
}
