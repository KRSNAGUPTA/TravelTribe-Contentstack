import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-paper px-6">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(50% 40% at 50% 40%, hsl(var(--primary) / 0.10) 0%, transparent 65%)
          `,
        }}
      />

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

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <h1 className="pacifico-regular text-[6rem] font-semibold leading-none tracking-tight text-primary sm:text-[8rem]">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
          Looks like you took a wrong turn
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[0.95rem] font-light leading-relaxed text-ink-muted sm:text-base">
          The page you're looking for doesn't exist, or may have been moved.
          Let's get you back on the road.
        </p>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => navigate("/")}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-[0.85rem] font-semibold text-on-primary shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover active:translate-y-0 sm:h-12 sm:px-7 sm:text-[0.88rem]"
          >
            <Home className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}