import { HeadContent, Link, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { X } from 'lucide-react'

const TanStackDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-devtools').then((m) => ({ default: m.TanStackDevtools })))
  : null
const TanStackRouterDevtoolsPanel = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-router-devtools').then((m) => ({ default: m.TanStackRouterDevtoolsPanel })))
  : null
import appCss from '../styles.css?url'
import { Header } from '../components/layout/Header'
import { PromoBanner } from '../components/sections/PromoBanner'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Shalom Cleans | Boutique Cleaning Rituals & Restoration',
      },
      {
        name: 'description',
        content: 'Bespoke cleaning rituals for modern sanctuaries. We restore tranquility to your home through organic, precise, and restorative purification. The new standard in residential bliss.',
      },
      {
        property: 'og:title',
        content: 'Shalom Cleans | Boutique Cleaning Rituals & Restoration',
      },
      {
        property: 'og:description',
        content: 'Experience the restorative power of a truly pristine home. Organic cleaning rituals tailored to your unique architectural rhythm.',
      },
      {
        property: 'og:image',
        content: '/preview.png',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Shalom Cleans | Boutique Cleaning Rituals & Restoration',
      },
      {
        name: 'twitter:description',
        content: 'Bespoke cleaning rituals for modern sanctuaries. Precision cleaning with a boutique approach.',
      },
      {
        name: 'twitter:image',
        content: '/preview.png',
      },
      {
        name: 'keywords',
        content: 'luxury cleaning, residential cleaning, boutique cleaning rituals, organic home restoration, shalom cleans, pristine homes',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: '',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
        sizes: 'any',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '192x192',
        href: '/favicon-192.png',
      },
      {
        rel: 'preload',
        as: 'image',
        href: '/hero.webp',
        type: 'image/webp',
        fetchPriority: 'high',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center text-center px-4 space-y-6">
        <h1 className="text-8xl font-display font-medium text-obsidian/10">404</h1>
        <h2 className="text-3xl font-display font-medium">Lost in the serenity.</h2>
        <p className="text-obsidian/60 max-w-sm">
          The page you're looking for has been moved or cleaned away.
        </p>
        <Link to="/" className="bg-obsidian text-white px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform duration-200">
          Return Home
        </Link>
      </div>
    )
  },
  errorComponent: ({ error }) => {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center text-center px-4 space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <X size={32} />
        </div>
        <h2 className="text-3xl font-display font-medium">Something went wrong.</h2>
        <p className="text-obsidian/60 max-w-sm">
          We encountered an unexpected error while preparing your pristine experience.
        </p>
        <pre className="text-xs p-4 bg-soft-zinc rounded-xl overflow-auto max-w-full">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="bg-obsidian text-white px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform duration-200"
        >
          Try Again
        </button>
      </div>
    )
  }
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAdmin = pathname.startsWith('/admin')
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="selection:bg-serenity selection:text-obsidian overflow-x-hidden" suppressHydrationWarning>
        {!isAdmin && (
          <>
            <PromoBanner />
            <Header />
          </>
        )}
        <main>
          {children}
        </main>

        {TanStackDevtools && TanStackRouterDevtoolsPanel && (
          <Suspense fallback={null}>
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  )
}
