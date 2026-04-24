import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { X } from 'lucide-react'
import appCss from '../styles.css?url'
import { Header } from '../components/layout/Header'
import { ThemeProvider } from '../lib/theme'

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
        href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap',
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/shalomcleans.png',
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
        <Link to="/" className="bg-obsidian text-white px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all">
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
          className="bg-obsidian text-white px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('shalom-theme');
                  const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <HeadContent />
      </head>
      <body className="selection:bg-serenity selection:text-obsidian overflow-x-hidden">
        <ThemeProvider>
          <Header />
          <main>
            {children}
          </main>

        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        </ThemeProvider>
      </body>
    </html>
  )
}
