import { createFileRoute } from "@tanstack/react-router"
import { LegalLayout, LegalSection } from "../components/layout/LegalLayout"

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy | Shalom Cleans" },
      {
        name: "description",
        content:
          "How Shalom Cleans handles refunds, satisfaction concerns, cancellations, and deposits.",
      },
    ],
  }),
  component: RefundPage,
})

function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" effectiveDate="May 27, 2026">
      <LegalSection title="Our commitment">
        <p>
          At <strong>Shalom Cleans</strong>, we are committed to providing
          professional cleaning services with quality and care. By booking our
          services, you agree to the following refund policy.
        </p>
      </LegalSection>

      <LegalSection title="1. No refund policy">
        <p>
          All services provided by Shalom Cleans are considered final and
          non-refundable once the cleaning service has been completed.
        </p>
        <p>
          Due to the nature of cleaning services being labor-based and time
          reserved specifically for each client, we do not provide refunds based
          on personal preference or subjective dissatisfaction.
        </p>
      </LegalSection>

      <LegalSection title="2. Satisfaction concerns">
        <p>
          If there is a legitimate concern regarding the quality of service,
          clients must notify us within <strong>12 hours</strong> of service
          completion with photos and a detailed explanation of the issue.
        </p>
        <p>At our sole discretion, we may offer:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>A touch-up cleaning for the specific area of concern</li>
          <li>Service credit toward a future appointment</li>
        </ul>
        <p>Refunds will not be issued in place of re-clean services.</p>
      </LegalSection>

      <LegalSection title="3. Conditions not eligible for refund">
        <p>Shalom Cleans will not issue refunds for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pre-existing damage, stains, discoloration, mold, odors, rust, or permanent buildup</li>
          <li>Areas not included in the agreed cleaning package</li>
          <li>Dissatisfaction after the cleaner has left and no issue was reported during walkthrough</li>
          <li>Failure to allow us the opportunity to correct any issue</li>
          <li>Services impacted by clutter, excessive dirt, biohazards, pests, or unsafe conditions</li>
          <li>Results limited by the age or condition of surfaces/materials</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cancellation policy">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Cancellations made less than <strong>24 hours</strong> before the
            appointment will incur a cancellation fee of up to 50% of the booked
            service amount.
          </li>
          <li>
            Same-day cancellations are non-refundable and may be charged in
            full.
          </li>
          <li>
            If cleaners arrive and cannot access the property, a lockout fee or
            full service fee may apply.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Deposits">
        <p>
          Deposits made for deep cleaning, move-in/move-out cleaning, commercial
          cleaning, or recurring service reservations are non-refundable.
        </p>
      </LegalSection>

      <LegalSection title="6. Right to refuse service">
        <p>
          Shalom Cleans reserves the right to refuse or stop service at any
          time if conditions are unsafe, unsanitary beyond normal expectations,
          or if staff experiences harassment, threats, or inappropriate
          behavior.
        </p>
      </LegalSection>

      <LegalSection title="7. Chargebacks">
        <p>
          Clients agree not to initiate chargebacks without first contacting
          Shalom Cleans to resolve concerns. Fraudulent or unjustified
          chargebacks may result in collections action and denial of future
          services.
        </p>
      </LegalSection>

      <LegalSection title="8. Policy acceptance">
        <p>
          By booking a service with Shalom Cleans, the client acknowledges and
          agrees to this Refund Policy in full.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Shalom Cleans
          <br />
          Email:{" "}
          <a
            href="mailto:shalomcleans@gmail.com"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            shalomcleans@gmail.com
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
