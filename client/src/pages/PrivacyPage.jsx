import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 transform">
        <Header />
      </div>

      <main className="bg-bg-muted-soft text-text-dark">
        <section className="relative overflow-hidden border-b border-border-subtle">
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
            <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-text-dark sm:text-[2.75rem]">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm font-light text-text-muted">
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
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-dark">
              Introduction
            </h2>
            <p className="leading-relaxed text-text-muted">
              Travel Tribe is committed to protecting your privacy. This
              policy explains how we collect, use, and safeguard your
              information when you use our platform to discover and book
              student accommodations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-dark">
              Information We Collect
            </h3>
            <p className="leading-relaxed text-text-muted">
              We collect information you provide directly to us, such as when
              you create an account, make a booking, or contact us for
              support. This may include your name, email address, phone
              number, and payment details.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-text-muted">
              <li>Account details — name, email, phone number</li>
              <li>Booking information — hostel, room type, stay dates</li>
              <li>Payment data — processed securely via third-party providers</li>
              <li>Usage data — pages visited, device, browser information</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-text-dark">
              How We Use Your Information
            </h3>
            <p className="leading-relaxed text-text-muted">
              We use the information we collect to provide, maintain, and
              improve our services, process bookings, communicate with you,
              and ensure the safety of our platform.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-text-muted">
              <li>Process and confirm your hostel bookings</li>
              <li>Send booking confirmations and service updates</li>
              <li>Personalize your experience on our platform</li>
              <li>Detect and prevent fraudulent activity</li>
            </ul>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="rounded-2xl bg-primary/[0.05] p-6 ring-1 ring-primary/10 sm:p-8">
            <h3 className="mb-4 text-xl font-semibold text-text-dark">
              Your Rights
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-text-muted">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Lodge a complaint with a data protection authority</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-text-dark">Cookies</h3>
            <p className="text-text-muted">
              We use cookies and similar tracking technologies to enhance your
              experience, remember preferences, and analyze how our platform
              is used.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <p className="font-medium text-text-dark">Essential Cookies</p>
                <p className="mt-1 text-sm text-text-muted">
                  Required for core site functionality like authentication and
                  booking flows.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <p className="font-medium text-text-dark">Analytics Cookies</p>
                <p className="mt-1 text-sm text-text-muted">
                  Help us understand how visitors interact with the site so we
                  can improve it.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <p className="font-medium text-text-dark">Preference Cookies</p>
                <p className="mt-1 text-sm text-text-muted">
                  Remember your settings and choices across visits.
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <p className="font-medium text-text-dark">Marketing Cookies</p>
                <p className="mt-1 text-sm text-text-muted">
                  Used to deliver relevant advertisements and measure campaign
                  performance.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-text-dark">
              Third-Party Services
            </h3>
            <ul className="space-y-2 text-text-muted">
              <li>
                <span className="font-medium text-text-dark">Razorpay</span> —
                secure payment processing for bookings.
              </li>
              <li>
                <span className="font-medium text-text-dark">Google Analytics</span> —
                anonymized usage analytics.
              </li>
              <li>
                <span className="font-medium text-text-dark">Contentstack</span> —
                content delivery and CMS hosting.
              </li>
              <li>
                <span className="font-medium text-text-dark">Lytics</span> —
                personalization and audience insights.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-white p-6 text-center sm:p-8">
            <h3 className="mb-2 text-lg font-semibold text-text-dark">
              Questions?
            </h3>
            <p className="text-text-muted">
              Reach out to us at{" "}
              <a
                href="mailto:privacy@traveltribe.in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                privacy@traveltribe.in
              </a>
            </p>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}