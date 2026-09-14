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
      onTouchStart={() => setHovered(index)}
      onTouchEnd={() => setHovered(null)}
      className={cn(
        "group relative isolate w-full rounded-3xl transition-all duration-500 ease-out cursor-pointer",
        hovered !== null && hovered !== index && "scale-[0.98] md:scale-[0.97] opacity-75 md:opacity-70"
      )}
    >
      {/* Card Body with Elegant Soft Gradient & Inner Glow for Transparent SVGs */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-b from-white/80 to-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex items-center justify-center p-6 sm:p-8 transition-all duration-500 group-hover:border-[var(--primary)]/30 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
        
        {/* Subtle Backdrop Radial Glow for Transparent Assets */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--hero-grad-start)_0%,transparent_70%)] opacity-40 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />

        <img
          src={card.src}
          alt={card.title}
          className="relative z-10 max-h-[100%] sm:max-h-[80%] max-w-[85%] w-auto h-auto object-contain transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-[0_10px_15px_rgba(0,0,0,0.08)]"
          draggable="false"
        />

        {/* Desktop Hover Overlay with Frosted Glass Effect */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 hidden md:flex flex-col items-center justify-center p-6 text-center transition-all duration-500 rounded-3xl overflow-hidden",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          )}
        >
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md transition-all duration-500" />
          <h3
            className="relative text-xl lg:text-2xl font-bold tracking-tight text-white mb-2"
            {...card.titleProps}
          >
            {card.title}
          </h3>
          {card.description ? (
            <p
              className="relative max-w-xs text-sm text-gray-200 leading-relaxed font-normal"
              {...card.descriptionProps}
            >
              {card.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Card Text Footer (Default State for Mobile & Clean Layout) */}
      <div
        className={cn(
          "px-3 pt-4 sm:pt-5 text-center transition-all duration-500",
          isHovered ? "md:opacity-0 md:-translate-y-2" : "opacity-100 translate-y-0"
        )}
      >
        <h3
          className="text-lg sm:text-2xl font-semibold leading-tight text-[var(--text-dark)] transition-colors duration-300 group-hover:text-[var(--primary)]"
          {...card.titleProps}
        >
          {card.title}
        </h3>
        {card.description ? (
          <p
            className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed md:hidden"
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
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
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