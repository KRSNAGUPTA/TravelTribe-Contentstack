import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 transform">
        <Header />
      </div>

      <main className="bg-paper text-ink">
        <section className="relative overflow-hidden border-b border-hairline">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(50% 60% at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 65%)
              `,
            }}
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:px-10 sm:py-24">
            <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.75rem]">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm font-light text-ink-muted">
              Last updated on{" "}
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl space-y-14 px-6 py-16 sm:px-10 sm:py-20">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
              Agreement to Terms
            </h2>
            <p className="leading-relaxed text-ink-muted">
              By accessing or using Travel Tribe, you agree to be bound by
              these Terms of Service. If you do not agree with any part of
              these terms, you must not use our platform. These terms apply
              to all visitors, users, and others who access the service.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Use of Our Service
            </h3>
            <p className="leading-relaxed text-ink-muted">
              Travel Tribe provides a platform to discover and book student
              accommodations. You agree to use the platform only for lawful
              purposes and in accordance with these terms.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-ink-muted">
              <li>You must be at least 18 years old to make a booking</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must not use the platform for any illegal activity</li>
              <li>You must not attempt to disrupt or exploit the service</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Bookings and Payments
            </h3>
            <p className="leading-relaxed text-ink-muted">
              When you make a booking through Travel Tribe, you enter into a
              direct agreement with the hostel or property owner. Travel Tribe
              acts as a facilitator and is not a party to that agreement.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-ink-muted">
              <li>All prices are displayed in Indian Rupees (INR)</li>
              <li>Payment must be made through our approved payment partners</li>
              <li>Booking confirmation is subject to availability</li>
              <li>Additional charges may apply at the property</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Cancellations and Refunds
            </h3>
            <p className="leading-relaxed text-ink-muted">
              Cancellation and refund policies vary by property. Please review
              the specific policy displayed at the time of booking. In
              general, cancellations made within the allowed window are
              eligible for a refund as per the property's policy.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-ink-muted">
              <li>Refunds are processed to the original payment method</li>
              <li>Processing time is typically 5–7 business days</li>
              <li>Convenience fees may be non-refundable</li>
              <li>No-shows may not be eligible for a refund</li>
            </ul>
          </div>

          <div className="border-t border-hairline" />

          <div className="rounded-2xl bg-primary/[0.05] p-6 ring-1 ring-primary/10 sm:p-8">
            <h3 className="mb-4 text-xl font-semibold text-ink">
              User Responsibilities
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-ink-muted">
              <li>Provide accurate personal and booking information</li>
              <li>Respect the rules and policies of each property</li>
              <li>Treat hostel staff and other guests with respect</li>
              <li>Report any issues promptly through our support channels</li>
              <li>Do not damage property or engage in unlawful conduct</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Intellectual Property
            </h3>
            <p className="leading-relaxed text-ink-muted">
              All content on Travel Tribe — including logos, text, graphics,
              images, and software — is the property of Travel Tribe or its
              licensors and is protected by applicable intellectual property
              laws. You may not reproduce, distribute, or create derivative
              works without our express written permission.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Limitation of Liability
            </h3>
            <p className="leading-relaxed text-ink-muted">
              To the maximum extent permitted by law, Travel Tribe shall not
              be liable for any indirect, incidental, special, consequential,
              or punitive damages arising out of or related to your use of the
              platform. Our total liability shall not exceed the amount paid
              by you for the specific booking giving rise to the claim.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Termination
            </h3>
            <p className="leading-relaxed text-ink-muted">
              We reserve the right to suspend or terminate your account at any
              time, without notice, if we believe you have violated these
              terms or engaged in conduct harmful to Travel Tribe, its users,
              or its partners.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Governing Law
            </h3>
            <p className="leading-relaxed text-ink-muted">
              These terms shall be governed by and construed in accordance
              with the laws of India. Any disputes arising under these terms
              shall be subject to the exclusive jurisdiction of the courts of
              Mumbai, Maharashtra.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-ink">
              Changes to Terms
            </h3>
            <p className="leading-relaxed text-ink-muted">
              We may update these Terms of Service from time to time. When we
              do, we will revise the "Last updated" date at the top of this
              page. Your continued use of the platform after any changes
              constitutes acceptance of the revised terms.
            </p>
          </div>

          <div className="rounded-2xl border border-hairline bg-white p-6 text-center sm:p-8">
            <h3 className="mb-2 text-lg font-semibold text-ink">
              Questions?
            </h3>
            <p className="text-ink-muted">
              Reach out to us at{" "}
              <a
                href="mailto:legal@traveltribe.in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                legal@traveltribe.in
              </a>
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}