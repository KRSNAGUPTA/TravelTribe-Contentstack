export default function Loading() {
  return (
    <div className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-bg-muted-soft">
      {/* Soft coral radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(50% 40% at 50% 40%, hsl(var(--primary) / 0.10) 0%, transparent 65%)
          `,
        }}
      />

      {/* Faint grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--text-dark) / 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--text-dark) / 0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Animated brand mark */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          {/* Outer pulse ring */}
          <span className="absolute inset-0 rounded-full border border-primary/20" />
          <span
            className="absolute inset-0 rounded-full border border-primary/40 animate-ping"
            style={{ animationDuration: "2.2s" }}
          />

          {/* Coral core with orbit */}
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/25">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
          </span>

          {/* Orbiting dot */}
          <span
            className="absolute h-1.5 w-1.5 rounded-full bg-primary/80"
            style={{
              animation: "orbit 1.8s linear infinite",
              transformOrigin: "40px 40px",
            }}
          />
        </div>

        {/* Brand wordmark */}
        <h1 className="pacifico-regular mt-8 text-3xl font-semibold tracking-tight text-text-dark sm:text-4xl">
          Travel Tribe
        </h1>

        {/* Tagline */}
        <p className="mt-3 max-w-sm text-[0.9rem] font-light leading-relaxed text-text-muted sm:text-base">
          Finding you the best student accommodations with ease and comfort.
        </p>

        {/* Minimal inline progress indicator */}
        <div className="mt-8 flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/60"
              style={{
                animation: "bounceDot 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframes — scoped to this component */}
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%           { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}