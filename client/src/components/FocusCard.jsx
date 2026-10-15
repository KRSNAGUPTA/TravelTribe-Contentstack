import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";

const FocusCard = memo(function FocusCard({
  card,
  index,
  hovered,
  setHovered,
}) {
  return (
    <article
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      onTouchStart={() => setHovered(index)}
      onTouchEnd={() => setHovered(null)}
      className={cn(
        "group relative isolate w-full transition-all duration-500 ease-out",
        hovered !== null && hovered !== index && "opacity-60"
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-3xl border border-hairline bg-white transition-all duration-500",
          "shadow-[0_2px_20px_-8px_rgba(0,0,0,0.06)]",
          "group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-[0_20px_50px_-20px_var(--card-shadow-hover)]"
        )}
      >
        <div
          className={cn(
            "relative flex w-full items-center justify-center overflow-hidden",
            "bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03]",
            "aspect-[4/3]"
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, hsl(var(--primary) / 0.10) 0%, transparent 65%)",
            }}
          />

          <span className="absolute left-5 top-5 z-10 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/70">
            {String(index + 1).padStart(2, "0")}
          </span>

          <img
            src={card.src}
            alt={card.title}
            draggable="false"
            className={cn(
              "relative z-10 max-h-[72%] max-w-[72%] object-contain",
              "drop-shadow-[0_18px_28px_rgba(0,0,0,0.10)]",
              "transition-transform duration-700 ease-out will-change-transform",
              "group-hover:scale-[1.06]"
            )}
          />
        </div>

        <div className="flex flex-1 flex-col px-6 pb-7 pt-6 sm:px-7 sm:pb-8 sm:pt-7">
          <span
            aria-hidden="true"
            className="mb-4 block h-px w-10 bg-primary/60 transition-all duration-500 group-hover:w-16 group-hover:bg-primary"
          />

          <h3
            className="line-clamp-2 text-lg font-semibold leading-[1.15] tracking-[-0.02em] text-ink transition-colors duration-300 group-hover:text-primary sm:text-xl"
            {...card.titleProps}
          >
            {card.title}
          </h3>

          {card.description ? (
            <p
              className="mt-3 line-clamp-3 text-[0.875rem] font-light leading-[1.65] text-ink-muted sm:text-[0.9rem]"
              {...card.descriptionProps}
            >
              {card.description}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export function FocusCards({ cards = [] }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-7 lg:grid-cols-3 lg:gap-8">
        {cards.map((card, index) => (
          <FocusCard
            key={`${card.title}-${index}`}
            card={card}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
          />
        ))}
      </div>
    </div>
  );
}