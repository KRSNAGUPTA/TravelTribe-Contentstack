import React, { memo, useState } from "react";
import { cn } from "@/lib/utils";

const FocusCard = memo(function FocusCard({
  card,
  index,
  hovered,
  setHovered,
}) {
  const isHovered = hovered === index;

  return (
    <article
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "group relative isolate w-full rounded-[2rem] transition-all duration-500 ease-out",
        hovered !== null && hovered !== index && "scale-[0.97] opacity-70",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[2rem]">
        <img
          src={card.src}
          alt={card.title}
          className="absolute inset-0 h-full w-full object-contain p-1 md:p-2 transition-transform duration-500 group-hover:scale-110"
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 hidden md:flex flex-col items-center justify-center p-6 text-center transition-all duration-500",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          )}
        >
          <div className="absolute inset-0 rounded-[2rem] bg-black/70" />
          <h3
            className="relative text-2xl font-semibold leading-tight text-white"
            {...card.titleProps}
          >
            {card.title}
          </h3>
          {card.description ? (
            <p
              className="relative mt-2 max-w-xs text-sm text-white/90 leading-relaxed"
              {...card.descriptionProps}
            >
              {card.description}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "px-3 pt-5 md:px-4 md:pt-6 text-center transition-all duration-500",
          isHovered ? "md:opacity-0 md:-translate-y-4" : "opacity-100 translate-y-0",
        )}
      >
        <h3
          className="text-2xl md:text-3xl font-semibold leading-tight text-[var(--text-dark)]"
          {...card.titleProps}
        >
          {card.title}
        </h3>
        {card.description ? (
          <p
            className="mt-2 text-base text-[var(--text-muted)] leading-relaxed md:hidden"
            {...card.descriptionProps}
          >
            {card.description}
          </p>
        ) : null}
      </div>
    </article>
  );
});

export function FocusCards({ cards = [] }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="w-full max-w-7xl mx-auto py-10 md:py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
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
