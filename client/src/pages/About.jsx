import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React from "react";

const aboutSections = [
  {
    id: "what-is",
    kicker: "The idea",
    title: "What is TravelTribe?",
    description:
      "A student-focused hostel booking platform. We make it easy to find affordable, well-reviewed stays in any city — whether you're moving for university or just passing through.",
  },
  {
    id: "our-mission",
    kicker: "Why we build",
    title: "Our Mission",
    description:
      "Transparent pricing, verified listings, and real reviews. So students and young professionals can find safe, affordable places near campus or work — without the hassle.",
  },
  {
    id: "join-community",
    kicker: "Come along",
    title: "Join Our Community",
    description:
      "More than a booking platform — a growing network of students and travelers sharing real experiences. Join us and help build trust, one stay at a time.",
  },
];

function About() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-paper text-ink">
      {/* Fixed dock — highest z, sits above footer */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-4">
        <div className="pointer-events-auto">
          <Header />
        </div>
      </div>

      <main className="w-full pb-24">
        {/* ---- Hero band ---- */}
        <section className="relative w-full bg-primary">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, hsl(var(--on-primary)) 1.2px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 sm:px-10 sm:pb-32 sm:pt-28 md:px-20 md:pb-40 md:pt-32">
            <h1 className="max-w-3xl text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.04em] text-on-primary sm:text-[3.2rem] md:text-[4rem]">
              About
              <br className="sm:hidden" />
              <span className="sm:ml-3">TravelTribe</span>
            </h1>

            <p className="mt-7 max-w-md text-[1.1rem] font-light leading-[1.65] text-on-primary/85 sm:max-w-lg sm:text-lg">
              Your trusted hostel booking platform. Find budget-friendly stays
              with ease.
            </p>

            <div className="mt-10 flex flex-col gap-5 text-on-primary/85 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-on-primary/50" />
                <span className="text-[0.72rem] uppercase tracking-[0.24em] sm:text-xs sm:tracking-[0.2em]">
                  Est. 2026
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-[0.72rem] uppercase tracking-[0.24em] sm:text-xs sm:tracking-[0.2em]">
                  Student first
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-[0.72rem] uppercase tracking-[0.24em] sm:text-xs sm:tracking-[0.2em]">
                  Community driven
                </span>
              </div>
            </div>
          </div>

          <svg
            aria-hidden="true"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            shapeRendering="geometricPrecision"
            className="absolute -bottom-px left-0 h-16 w-full sm:h-20 md:h-28"
            style={{ color: "hsl(var(--bg-muted-soft))" }}
          >
            <path
              fill="currentColor"
              d="M0,180 C240,200 480,20 720,100 C960,180 1200,20 1440,120 L1440,200 L0,200 Z"
            />
          </svg>
        </section>

        {/* ---- Content ---- */}
        <div className="relative z-10 -mt-px bg-paper sm:mt-0">
          <section className="mx-auto max-w-6xl px-6 pb-24 pt-14 sm:px-10 sm:pb-28 sm:pt-20 md:px-20 md:pb-36 md:pt-28">
            <div className="flex flex-col gap-24 sm:gap-24 md:gap-28">
              {aboutSections.map((section, index) => {
                const flip = index % 2 === 1;

                return (
                  <article
                    key={section.id}
                    className={`${
                      flip
                        ? "sm:flex sm:flex-row-reverse sm:items-start sm:gap-10 md:gap-16"
                        : "sm:flex sm:flex-row sm:items-start sm:gap-10 md:gap-16"
                    }`}
                  >
                    {/* ============ MOBILE LAYOUT ============ */}
                    <div className="flex flex-col gap-6 sm:hidden">
                      <div className="flex items-start gap-5">
                        <div className="relative inline-block shrink-0">
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-[4px] top-[4px] select-none font-semibold leading-[0.8] tracking-[-0.08em] text-accent"
                            style={{ fontSize: "clamp(4.5rem, 22vw, 6.5rem)" }}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className="relative select-none font-semibold leading-[0.8] tracking-[-0.08em] text-primary"
                            style={{ fontSize: "clamp(4.5rem, 22vw, 6.5rem)" }}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        <div className="flex-1 pt-1">
                          <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-accent-ink">
                            {section.kicker}
                          </p>
                          <h2 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
                            {section.title}
                          </h2>
                        </div>
                      </div>

                      <p className="text-[1.15rem] font-light leading-[1.7] tracking-[-0.005em] text-ink-muted">
                        {section.description}
                      </p>
                    </div>

                    {/* ============ DESKTOP LAYOUT ============ */}
                    <div className="hidden sm:contents">
                      <div className="relative inline-block shrink-0">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-[5px] top-[5px] select-none font-semibold leading-[0.8] tracking-[-0.08em] text-accent sm:left-[7px] sm:top-[7px]"
                          style={{ fontSize: "clamp(4.5rem, 18vw, 9.5rem)" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="relative select-none font-semibold leading-[0.8] tracking-[-0.08em] text-primary"
                          style={{ fontSize: "clamp(4.5rem, 18vw, 9.5rem)" }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div
                        className={`flex-1 pt-1 sm:pt-2 ${
                          flip ? "sm:text-right" : ""
                        }`}
                      >
                        <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-accent-ink sm:text-[0.72rem] sm:tracking-[0.22em]">
                          {section.kicker}
                        </p>

                        <h2 className="mb-4 text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.03em] text-ink sm:text-3xl md:text-[2.4rem]">
                          {section.title}
                        </h2>

                        <p
                          className={`max-w-2xl text-[1.02rem] font-light leading-[1.8] tracking-[-0.005em] text-ink-muted sm:text-[1.08rem] sm:leading-[1.85] ${
                            flip ? "sm:ml-auto" : ""
                          }`}
                        >
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;