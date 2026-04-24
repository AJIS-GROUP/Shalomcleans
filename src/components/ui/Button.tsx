import * as React from "react"
import { ArrowRight } from "lucide-react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  withArrow?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', withArrow, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-obsidian dark:bg-white text-white dark:text-obsidian hover:bg-obsidian/90 dark:hover:bg-white/90',
      secondary: 'bg-serenity dark:bg-white/10 text-obsidian dark:text-white hover:bg-serenity/80 dark:hover:bg-white/15',
      glass: 'glass-pill text-obsidian dark:text-white hover:bg-white/90 dark:hover:bg-white/10',
    }

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={`
          group relative inline-flex items-center justify-center font-medium rounded-full 
          transition-all duration-300 ease-fluid active:scale-95 disabled:opacity-50
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...props}
      >
        <span className="relative flex items-center gap-2">
          {children}
          {withArrow && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 transition-transform duration-500 group-hover:translate-x-1">
              <ArrowRight size={14} />
            </span>
          )}
        </span>
      </button>
    )
  }
)

Button.displayName = "Button"
