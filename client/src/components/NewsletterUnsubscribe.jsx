import React, { useMemo, useState } from "react";
import { MailCheck, MailX, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const unsubscribeReasons = [
  "Too many emails",
  "Not relevant to my travel style",
  "Signed up by mistake",
  "Already booked my stay",
  "Other",
];

function NewsletterUnsubscribe({ email: propEmail = "" }) {
  const initialEmail = useMemo(() => {
    if (propEmail) return propEmail;
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") || "";
  }, [propEmail]);

  const [emailValue, setEmailValue] = useState(initialEmail);
  const [selectedReason, setSelectedReason] = useState(unsubscribeReasons[0]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleUnsubscribe = async (event) => {
    event.preventDefault();

    if (!emailValue.trim()) return;

    setIsSubmitting(true);

    // trackEvent("newsletter_unsubscribe", {
    //   _e: "newsletter_unsubscribe",
    //   newsletter_email: emailValue,
    //   reason: selectedReason,
    //   feedback_provided: feedback.trim() !== "",
    // });

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[var(--hero-grad-start)] via-white to-[var(--hero-grad-end)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.9),transparent_36%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 rounded-3xl border border-[var(--border)] bg-white/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:p-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:p-10">
        <div className="rounded-2xl bg-white p-6 sm:p-8 border border-[var(--border)]">
          <p className="bubblegum-sans-regular inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--accent)] px-3 py-1 text-sm text-[var(--text-dark)]">
            <Sparkles className="h-4 w-4" />
            TravelTribe Newsletter
          </p>

          <h1 className="mt-4 text-3xl font-semibold leading-tight text-[var(--text-dark)] sm:text-4xl">
            {isDone ? "You're Unsubscribed" : "Your Inbox, Your Rules"}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            {isDone
              ? "No more travel updates from us at this email. You can re-subscribe any time from your profile."
              : "Tell us why you are unsubscribing so we can improve. This helps us keep only useful updates in your inbox."}
          </p>

          <div className="mt-6 space-y-3 text-sm text-[var(--text-dark)]">
            <div className="flex items-start gap-3 rounded-xl bg-[var(--hero-grad-start)]/40 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <p>We only use your response to improve newsletter quality.</p>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[var(--hero-grad-start)]/40 p-3">
              <MailCheck className="mt-0.5 h-4 w-4 text-[var(--primary)]" />
              <p>You will still receive booking confirmations and account alerts.</p>
            </div>
          </div>
        </div>

        {!isDone ? (
          <form onSubmit={handleUnsubscribe} className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
            <div className="mb-5 space-y-2">
              <label htmlFor="unsubscribe-email" className="text-sm font-medium text-[var(--text-dark)]">
                Email Address
              </label>
              <Input
                id="unsubscribe-email"
                type="email"
                required
                placeholder="you@example.com"
                value={emailValue}
                onChange={(event) => setEmailValue(event.target.value)}
                className="h-11 border-[var(--border)] bg-white"
              />
            </div>

            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-[var(--text-dark)]">Reason</p>
              <div className="flex flex-wrap gap-2">
                {unsubscribeReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                      selectedReason === reason
                        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
                        : "border-[var(--border)] bg-white text-[var(--text-dark)] hover:border-[var(--primary)]"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <label htmlFor="feedback" className="text-sm font-medium text-[var(--text-dark)]">
                Additional Feedback (Optional)
              </label>
              <textarea
                id="feedback"
                rows={4}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Share anything that can help us improve."
                className="w-full rounded-md border border-[var(--border)] bg-white p-3 text-sm text-[var(--text-dark)] outline-none ring-0 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !emailValue.trim()}
              className="h-11 w-full rounded-xl bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
            >
              <MailX className="mr-2 h-4 w-4" />
              {isSubmitting ? "Unsubscribing..." : "Unsubscribe"}
            </Button>

            <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
              Selected reason: <span className="font-medium text-[var(--text-dark)]">{selectedReason}</span>
            </p>
          </form>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--hero-grad-start)]/40 p-8 text-center">
            <div className="mb-4 rounded-full bg-white p-3 text-[var(--primary)] shadow-sm">
              <MailCheck className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--text-dark)]">Done. You are unsubscribed.</h2>
            <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
              Your preferences have been updated for <span className="font-medium">{emailValue}</span>.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 rounded-xl border-[var(--border)] text-[var(--text-dark)]"
              onClick={() => {
                setIsDone(false);
                setFeedback("");
              }}
            >
              Edit Response
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default NewsletterUnsubscribe;