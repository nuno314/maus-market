"use client";

import { useEffect, useState } from "react";

const SLIDE = "min(720px, 62vw)";
const GAP = "1.25rem";
const SLIDES = [
  {
    src: "https://www.30th.pokemon-card.com/images/m6a/m6a_kv_1e26c802.webp",
    alt: "Pokémon Card 30th Celebration",
  },
  {
    src: "https://www.pokemon-card.com/assets/images/index/slides/576f46eefba24f4fbdacec2fcd6df397.png",
    alt: "Pokémon Card 30th Celebration đang phát hành",
  },
  {
    src: "https://www.pokemon-card.com/assets/images/index/slides/b6071896673940f8a0d9fcd927641e8e.jpg",
    alt: "Banner Pokémon Card Game",
  },
];

const LOOP = [SLIDES[SLIDES.length - 1]!, ...SLIDES, SLIDES[0]!];

export function HomeCarousel() {
  const [index, setIndex] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const active = index === 0 ? SLIDES.length - 1 : index === LOOP.length - 1 ? 0 : index - 1;

  useEffect(() => {
    if (paused) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timer = window.setInterval(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (animate) return;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  function settle() {
    if (index === 0) {
      setAnimate(false);
      setIndex(SLIDES.length);
    } else if (index === LOOP.length - 1) {
      setAnimate(false);
      setIndex(1);
    }
  }

  return (
    <section
      className="relative left-1/2 mb-6 w-screen max-w-[100vw] -translate-x-1/2 -mt-6 overflow-hidden bg-white py-8"
      aria-roledescription="carousel"
      aria-label="Banner 30th Celebration"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className={`flex items-center ${animate ? "transition-transform duration-700 ease-out" : ""}`}
          style={{
            gap: GAP,
            transform: `translateX(calc(50% - (${SLIDE}) / 2 - ${index} * ((${SLIDE}) + ${GAP})))`,
          }}
          onTransitionEnd={settle}
        >
          {LOOP.map((slide, slideIndex) => (
            <button
              key={`${slide.src}-${slideIndex}`}
              type="button"
              onClick={() => {
                setAnimate(true);
                setIndex(slideIndex);
              }}
              className="w-[min(720px,62vw)] shrink-0"
              aria-label={slide.alt}
              aria-current={slideIndex === index}
            >
              <img
                src={slide.src}
                alt=""
                className="aspect-[1680/1040] w-full bg-white object-contain"
                draggable={false}
                {...(slideIndex === 1 ? { fetchPriority: "high" as const } : {})}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Banner ${slideIndex + 1}`}
            aria-current={slideIndex === active}
            onClick={() => {
              setAnimate(true);
              setIndex(slideIndex + 1);
            }}
            className={`h-1.5 rounded-full transition-all ${slideIndex === active ? "w-6 bg-[#24344a]" : "w-1.5 bg-[#24344a]/35"}`}
          />
        ))}
      </div>
    </section>
  );
}
