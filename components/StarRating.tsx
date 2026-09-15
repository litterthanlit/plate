"use client";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  label?: string;
};

export function StarRating({
  value,
  onChange,
  label = "Rating",
}: StarRatingProps) {
  const interactive = typeof onChange === "function";

  return (
    <div
      role={interactive ? "radiogroup" : "img"}
      aria-label={label}
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const mark = filled ? "★" : "☆";
        if (!interactive) {
          return (
            <span
              key={n}
              className={filled ? "text-ink" : "text-ink/25"}
              aria-hidden
            >
              {mark}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            className={`h-10 w-10 text-xl leading-none ${
              filled ? "text-ink" : "text-ink/25"
            } hover:text-ink`}
          >
            {mark}
          </button>
        );
      })}
    </div>
  );
}
