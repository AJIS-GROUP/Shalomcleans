import * as React from "react"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  innerClassName?: string
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, innerClassName, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={`double-bezel group transition-all duration-700 ease-fluid hover:bg-obsidian/10 ${className}`}
        {...props}
      >
        <div className={`double-bezel-inner h-full p-6 transition-all duration-700 ease-fluid group-hover:shadow-[inset_0_1px_20px_rgba(0,0,0,0.02)] ${innerClassName}`}>
          {children}
        </div>
      </div>
    )
  }
)

Card.displayName = "Card"
