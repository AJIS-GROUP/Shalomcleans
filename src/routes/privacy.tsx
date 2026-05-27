import { createFileRoute } from "@tanstack/react-router"
import { LegalLayout, LegalSection } from "../components/layout/LegalLayout"

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Shalomcleans" },
      {
        name: "description",
        content:
          "How Shalomcleans collects, uses, and protects your personal information when you request a quote or book a cleaning.",
      },
    ],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="May 27, 2026">
      <LegalSection title="Who we are">
        <p>
          Shalomcleans is a Residential and Commercial cleaning services provider
          operating in the Atlanta metropolitan area. This Privacy Policy describes
          how we collect, use, and share personal information when you visit{" "}
          <strong>shalomcleans.com</strong>, request a quote, or book a service.
        </p>
        <p>
          If you have any questions about this policy or your data, contact us at{" "}
          <a
            href="mailto:Shalomcleans@gmail.com"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            Shalomcleans@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>When you fill out our quote request form, we collect:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Service address and ZIP code</li>
          <li>The cleaning service you are interested in</li>
        </ul>
        <p>
          When you visit our website, we also automatically collect technical data
          such as your IP address, browser type, device information, pages you view,
          and how you arrived at our site (referring URL, ad click identifiers).
        </p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Booking and service delivery</strong> — to contact you about
            your quote request, confirm your appointment, and provide the cleaning
            service you booked.
          </li>
          <li>
            <strong>AI callback</strong> — when you submit a quote request, our
            voice assistant (powered by Vapi) will call you within ~30 seconds to
            confirm details and finalize scheduling.
          </li>
          <li>
            <strong>Advertising and analytics</strong> — to measure the
            effectiveness of our advertising on Meta (Facebook and Instagram) and
            to retarget visitors who have shown interest in our services.
          </li>
          <li>
            <strong>Service improvement</strong> — to understand how visitors use
            our site so we can improve it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies and tracking technologies">
        <p>We use the following tracking technologies on this site:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Meta Pixel</strong> — a small piece of code that records page
            views, button clicks, and form submissions. It allows us to measure ad
            performance and show relevant ads on Facebook and Instagram.
          </li>
          <li>
            <strong>Meta Conversions API (CAPI)</strong> — a server-to-server
            integration that sends the same event data directly from our servers
            to Meta. Personal identifiers (email, phone, name, ZIP) are SHA-256
            hashed before transmission.
          </li>
          <li>
            <strong>First-party cookies</strong> — used by the pixel to identify
            return visitors. No third-party advertising cookies are set by this
            site directly.
          </li>
        </ul>
        <p>
          You can control cookies through your browser settings or opt out of
          Meta's personalized advertising at{" "}
          <a
            href="https://www.facebook.com/settings?tab=ads"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            facebook.com/settings?tab=ads
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Who we share information with">
        <p>We share your personal data only with service providers necessary to operate our business:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>BookingKoala</strong> — our booking platform. Receives your
            contact and service details to schedule appointments.
          </li>
          <li>
            <strong>Vapi</strong> — provides the AI voice assistant that calls you
            to confirm bookings. Receives your name, phone, email, and service
            request.
          </li>
          <li>
            <strong>Meta (Facebook / Instagram)</strong> — receives event data
            (page views, form submissions, booking clicks) and hashed identifiers
            via the Meta Pixel and Conversions API for ad measurement and
            optimization.
          </li>
          <li>
            <strong>Convex</strong> — our backend infrastructure provider; stores
            booking records and operational logs.
          </li>
          <li>
            <strong>Vercel</strong> — hosts our website.
          </li>
        </ul>
        <p>
          We do not sell your personal information. We do not share your data
          with anyone outside the providers listed above.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep your data">
        <p>
          We retain booking and quote request data for as long as your account is
          active with us, plus up to <strong>3 years</strong> for tax and
          recordkeeping purposes. Advertising and analytics event data is
          retained according to Meta's standard retention policy
          (typically 90–180 days for retargeting audiences).
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your data (subject to recordkeeping obligations)</li>
          <li>Opt out of marketing communications at any time</li>
          <li>
            Request that we stop tracking you across Meta properties (manage at{" "}
            <a
              href="https://www.facebook.com/settings?tab=ads"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-obsidian dark:hover:text-white"
            >
              your Meta ad settings
            </a>
            )
          </li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a
            href="mailto:Shalomcleans@gmail.com"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            Shalomcleans@gmail.com
          </a>{" "}
          and we will respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="Children's privacy">
        <p>
          Our services are intended for adults 18 and older. We do not knowingly
          collect personal information from children under 13. If you believe we
          have inadvertently collected such information, please contact us so we
          can delete it.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use industry-standard security practices to protect your information,
          including HTTPS encryption in transit, hashed identifiers for advertising
          data, and access controls on our backend systems. No transmission over
          the internet is ever 100% secure; we cannot guarantee absolute security
          but we work hard to protect your data.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we will
          update the &ldquo;Effective&rdquo; date at the top of this page. Material
          changes will be communicated through a notice on our website.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions, requests, or complaints about this policy can be sent to:
        </p>
        <p>
          Shalomcleans
          <br />
          Atlanta, GA
          <br />
          Email:{" "}
          <a
            href="mailto:Shalomcleans@gmail.com"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            Shalomcleans@gmail.com
          </a>
          <br />
          Phone:{" "}
          <a
            href="tel:+14706938192"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            470-693-8192
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
