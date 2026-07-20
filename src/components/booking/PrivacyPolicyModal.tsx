"use client";

import { Modal } from "@/components/ui/Modal";

export function PrivacyPolicyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Privacy Policy" size="lg">
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-content-muted">
        <p>
          Steak Town (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is
          committed to protecting the personal information you share with us when making a
          reservation. This Privacy Policy explains what information we collect, how we use it,
          and the choices you have.
        </p>

        <section>
          <h4 className="font-semibold text-content">Information We Collect</h4>
          <p className="mt-1">
            When you book a table through this website, we collect the details you provide in the
            reservation form: your full name, phone number, email address (if given), party size,
            preferred location, date and time, and any special requests or menu preferences you
            select.
          </p>
        </section>

        <section>
          <h4 className="font-semibold text-content">How We Use Your Information</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>To create, manage, and confirm your reservation.</li>
            <li>
              To contact you about your booking — including confirmation, changes, or reminders —
              by phone, SMS, or email.
            </li>
            <li>To assign a table suited to your party size and prepare for any special requests.</li>
            <li>To improve our service and respond to your feedback.</li>
          </ul>
        </section>

        <section>
          <h4 className="font-semibold text-content">Sharing Your Information</h4>
          <p className="mt-1">
            We do not sell or rent your personal information. Reservation details are shared only
            with Steak Town staff at the relevant location and with trusted service providers who
            help us operate our booking system — for example, our email delivery provider, used
            solely to send you reservation confirmations. These providers may only use your data
            to perform the service we&apos;ve asked of them.
          </p>
        </section>

        <section>
          <h4 className="font-semibold text-content">Data Retention</h4>
          <p className="mt-1">
            We retain reservation information for as long as needed to manage your booking, and
            for a reasonable period afterward for record-keeping, customer service, and legal
            compliance purposes, after which it is deleted or anonymized.
          </p>
        </section>

        <section>
          <h4 className="font-semibold text-content">Your Rights</h4>
          <p className="mt-1">
            You may ask us to access, correct, or delete the personal information we hold about
            you at any time by contacting us using the details below. We handle such requests in
            line with Qatar&apos;s Personal Data Privacy Protection Law (Law No. 13 of 2016).
          </p>
        </section>

        <section>
          <h4 className="font-semibold text-content">Contact Us</h4>
          <p className="mt-1">
            If you have any questions about this Privacy Policy or how your information is
            handled, please contact us at +974 3008 2849 or +974 4033 7003.
          </p>
        </section>

        <p className="text-xs text-content-dim/70">Last updated: July 2026.</p>
      </div>
    </Modal>
  );
}
