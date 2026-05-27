import { createFileRoute } from "@tanstack/react-router"
import { LegalLayout, LegalSection } from "../components/layout/LegalLayout"

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Shalom Cleans" },
      {
        name: "description",
        content:
          "The terms that govern your use of Shalom Cleans' website and residential cleaning services in the Atlanta metro area.",
      },
    ],
  }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="May 27, 2026">
      <LegalSection title="Agreement">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
          use of <strong>shalomcleans.com</strong> (the &ldquo;Site&rdquo;) and
          the residential cleaning services offered by <strong>Shalom Cleans</strong>{" "}
          (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By using the
          Site or booking a service, you agree to these Terms.
        </p>
      </LegalSection>

      <LegalSection title="Services we offer">
        <p>
          Shalom Cleans provides residential cleaning services in the Atlanta
          metropolitan area, including but not limited to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Standard recurring cleaning</li>
          <li>Deep cleaning</li>
          <li>Move-in and move-out cleaning</li>
        </ul>
        <p>
          We currently service homes within an approximate 40-mile radius of
          Atlanta, including Midtown, Buckhead, Marietta, and surrounding
          communities.
        </p>
      </LegalSection>

      <LegalSection title="Booking and confirmation">
        <p>
          When you submit a quote request on our Site, an automated voice
          assistant (powered by our partner Vapi) will call you within
          approximately 30 seconds to confirm your details and schedule the
          appointment. Final booking is completed through our scheduling partner,
          BookingKoala. A booking is considered confirmed only after you have
          received written confirmation from us or BookingKoala.
        </p>
        <p>
          We reserve the right to decline a booking that falls outside our service
          area, exceeds our capacity, or that we determine, in good faith, would
          be unsafe to perform.
        </p>
      </LegalSection>

      <LegalSection title="Pricing and payment">
        <p>
          Pricing is based on the service type, home size, and any add-ons. Our
          quote is provided after we collect your service details. Final pricing
          is confirmed at booking. Payment is processed through BookingKoala
          according to the terms presented at checkout.
        </p>
        <p>
          Any additional services performed at your request beyond the quoted
          scope (e.g. extra rooms, special-condition cleaning) may incur
          additional charges, which we will communicate before performing the
          work.
        </p>
      </LegalSection>

      <LegalSection title="Cancellation and rescheduling">
        <p>
          You may cancel or reschedule a confirmed booking up to{" "}
          <strong>24 hours</strong> before the scheduled start time at no charge.
          Cancellations within 24 hours of the scheduled time may be subject to a
          cancellation fee of up to 50% of the booking total.
        </p>
        <p>
          We will make reasonable efforts to notify you in advance if we need to
          reschedule a booking. If we cannot reschedule to your satisfaction,
          you will receive a full refund of any pre-paid amount.
        </p>
      </LegalSection>

      <LegalSection title="Access and preparation">
        <p>
          You agree to provide our team with safe and reasonable access to the
          property at the scheduled time. If our team is unable to access the
          property due to no fault of ours, a lockout fee may apply.
        </p>
        <p>
          For your safety and ours, please secure pets, valuables, and any
          fragile items prior to our arrival. We are not responsible for damage
          to or loss of items that were not secured or were left in unsafe
          conditions.
        </p>
      </LegalSection>

      <LegalSection title="Satisfaction guarantee">
        <p>
          We stand behind our work. If you are not satisfied with any aspect of
          our service, contact us within <strong>24 hours</strong> of service
          completion and we will return to re-clean the affected area at no
          additional cost.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          Shalom Cleans carries liability insurance for the services we provide.
          Our liability is limited to the cost of the booking that gave rise to
          the claim, except in cases of gross negligence or willful misconduct.
        </p>
        <p>
          We are not liable for indirect, incidental, consequential, or punitive
          damages, including loss of business, lost profits, or property
          devaluation, arising from our services or the use of our Site.
        </p>
      </LegalSection>

      <LegalSection title="Site use">
        <p>
          You agree not to use our Site or services for any unlawful purpose, to
          attempt to interfere with the security or operation of our Site, or to
          submit false or misleading information when requesting a quote.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          All content on this Site — text, images, logos, design — is owned by
          Shalom Cleans or used under license, and is protected by copyright and
          trademark law. You may not reproduce, distribute, or use any content
          from this Site for commercial purposes without our written permission.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          Your use of our Site and services is also governed by our{" "}
          <a
            href="/privacy"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            Privacy Policy
          </a>
          , which describes how we collect, use, and share your personal
          information.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these Terms">
        <p>
          We may update these Terms from time to time. The &ldquo;Effective&rdquo;
          date at the top of this page reflects the most recent revision. Your
          continued use of the Site or services after a change constitutes
          acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of the State of Georgia, USA,
          without regard to its conflict of law provisions. Any dispute arising
          from these Terms or our services will be resolved in the courts of
          Fulton County, Georgia.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms can be sent to:
        </p>
        <p>
          Shalom Cleans
          <br />
          Atlanta, GA
          <br />
          <a
            href="mailto:hello@shalomcleans.com"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            hello@shalomcleans.com
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
