import { createFileRoute } from "@tanstack/react-router"
import { LegalLayout, LegalSection } from "../components/layout/LegalLayout"

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Shalom Cleans" },
      {
        name: "description",
        content:
          "The terms and conditions that govern your use of Shalom Cleans' website and cleaning services.",
      },
    ],
  }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" effectiveDate="May 27, 2026">
      <LegalSection title="Welcome">
        <p>
          Welcome to <strong>Shalom Cleans</strong>. These Terms &amp; Conditions
          govern the use of our services and website. By booking or using our
          services, you agree to all terms outlined below.
        </p>
      </LegalSection>

      <LegalSection title="1. Service scope">
        <p>
          Cleaning services are limited to the tasks included in the selected
          service package. Additional requests outside the agreed scope may
          result in extra charges and are subject to cleaner availability.
        </p>
      </LegalSection>

      <LegalSection title="2. Estimates & pricing">
        <p>
          All quotes provided are estimates based on the information given by
          the client. Final pricing may increase if:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>The property condition differs significantly from described conditions</li>
          <li>Additional cleaning time is required</li>
          <li>Additional rooms, areas, or services are requested</li>
        </ul>
        <p>
          Shalom Cleans reserves the right to adjust pricing upon arrival if
          necessary.
        </p>
      </LegalSection>

      <LegalSection title="3. Payment terms">
        <p>
          Payment is due immediately upon completion of service unless otherwise
          agreed in writing. Failure to make payment may result in:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Late fees</li>
          <li>Collection efforts</li>
          <li>Refusal of future services</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Client responsibilities">
        <p>Clients are responsible for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Providing access to the property at the scheduled time</li>
          <li>Ensuring running water and electricity are available</li>
          <li>Securing valuables, cash, jewelry, and fragile items</li>
          <li>Informing us of pets, hazards, or special cleaning conditions beforehand</li>
        </ul>
        <p>
          Shalom Cleans is not responsible for damage to improperly secured
          items.
        </p>
      </LegalSection>

      <LegalSection title="5. Limitation of liability">
        <p>Shalom Cleans is not liable for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pre-existing damage</li>
          <li>Wear and tear</li>
          <li>Improperly installed fixtures or decorations</li>
          <li>Damage resulting from unstable furniture or fragile items</li>
          <li>Normal wear to surfaces caused by cleaning products or methods</li>
        </ul>
        <p>
          Any claims for damages must be submitted in writing within{" "}
          <strong>24 hours</strong> of service completion. Liability for any
          approved claim shall not exceed the total amount paid for the specific
          cleaning service.
        </p>
      </LegalSection>

      <LegalSection title="6. Unsafe conditions">
        <p>Our cleaners may refuse service if the environment contains:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Biohazards</li>
          <li>Excessive bodily fluids</li>
          <li>Pest infestations</li>
          <li>Illegal substances</li>
          <li>Aggressive pets</li>
          <li>Unsafe or hostile conditions</li>
        </ul>
        <p>In such cases, cancellation fees may still apply.</p>
      </LegalSection>

      <LegalSection title="7. Photos & marketing">
        <p>
          Shalom Cleans may take before-and-after photos for quality control,
          training, and marketing purposes. Personal or identifying information
          will not be shared publicly without consent.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          All content, branding, logos, designs, and materials belonging to
          Shalom Cleans are protected and may not be copied or reproduced
          without written permission.
        </p>
      </LegalSection>

      <LegalSection title="9. Service guarantee disclaimer">
        <p>
          While we strive for excellent results, Shalom Cleans does not
          guarantee complete removal of all stains, odors, buildup, or damage
          due to material condition, age, or previous neglect.
        </p>
      </LegalSection>

      <LegalSection title="10. Refund policy">
        <p>
          Refunds, satisfaction concerns, cancellations, and deposits are
          governed by our{" "}
          <a
            href="/refund"
            className="underline hover:text-obsidian dark:hover:text-white"
          >
            Refund Policy
          </a>
          , which forms part of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to policies">
        <p>
          Shalom Cleans reserves the right to update or modify these terms at
          any time without prior notice.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>
          These Terms &amp; Conditions shall be governed by and interpreted in
          accordance with the laws of the State of Georgia.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact information">
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
