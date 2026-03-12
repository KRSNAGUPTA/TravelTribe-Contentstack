import React, { useState } from "react";
import { Copy, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function AdBlockNotice({ onRetry }) {
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const copyCurrentSite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.8),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.7),transparent_30%),linear-gradient(140deg,var(--hero-grad-start),#ffffff_45%,var(--hero-grad-end))] px-6 py-10">
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-[var(--accent)]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[var(--hero-grad-end)]/40 blur-3xl" />

      <div className="mx-auto flex min-h-[82vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-[var(--border)] bg-white/90 p-7 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur sm:p-10">


          <h2 className="text-center text-4xl font-bold tracking-tight pacifico-regular text-[var(--primary)] sm:text-5xl">
            Travel Tribe
          </h2>

          <div className="mx-auto mt-5 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary)] shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="text-center text-3xl font-semibold text-[var(--text-dark)] sm:text-4xl">
            Ad Blocker Detected On This Site
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            We do not run ads here. Please allow this site in your blocker so
            cookie consent and personalization can work properly.
          </p>

          <div className="mx-auto mt-7 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              type="button"
              onClick={onRetry}
              className="h-11 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)]"
            >
              I turned it off, Retry
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={copyCurrentSite}
              className="h-11 rounded-xl border-[var(--border)] text-[var(--text-dark)]"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Website copied" : "Copy website URL"}
            </Button>
          </div>

          <div className="mt-3 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHelp((prev) => !prev)}
              className="rounded-xl border-[var(--border)] text-[var(--text-dark)]"
            >
              {showHelp ? "Hide whitelist steps" : "How to whitelist"}
            </Button>
          </div>

          {showHelp && (
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--hero-grad-start)]/45 p-5 text-left text-sm text-[var(--text-muted)] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <p className="font-medium text-[var(--text-dark)]">
                For security reasons, websites cannot whitelist themselves.
              </p>
              <p className="mt-2">Add this domain to your extension allowlist:</p>
              <p className="mt-2 rounded-md bg-white px-3 py-2 font-medium text-[var(--text-dark)]">
                {window.location.origin}
              </p>

              <div className="mt-4 space-y-2 text-[var(--text-dark)]">
                <p className="font-medium">Quick steps:</p>
                <p>1. Open your ad blocker extension.</p>
                <p>2. Go to Settings, then Trusted sites or Allowlist.</p>
                <p>3. Paste this domain and save changes.</p>
                <p>4. Return here and click Retry.</p>
              </div>

              <a
                href="https://github.com/gorhill/uBlock/wiki/Dashboard:-Trusted-sites"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 font-medium text-[var(--primary)] hover:underline"
              >
                Learn trusted-sites setup
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          <p className="mx-auto mt-5 max-w-xl text-center text-xs text-[var(--text-muted)]">
            Privacy note: we only use this to enable essential personalization and improve recommendations.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AdBlockNotice;
