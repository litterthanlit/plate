"use client";

import Image from "next/image";
import { useState } from "react";
import type { Place } from "@/lib/types";

export function PlaceThumb({ place }: { place: Place }) {
  const [hidden, setHidden] = useState(false);
  if (!place.photoName || hidden) return null;

  const src = `/api/places/photo?name=${encodeURIComponent(place.photoName)}`;
  const credit = place.photoAttribution
    ? `Photo: ${place.photoAttribution}`
    : "Photo: Google";

  return (
    <figure className="shrink-0">
      <Image
        src={src}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="size-10 border border-ink/15 object-cover"
        onError={() => setHidden(true)}
      />
      <figcaption className="mt-1 max-w-[7.5rem] text-[9px] leading-tight text-ink/40">
        {place.photoAttributionUri ? (
          <a
            href={place.photoAttributionUri}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-ink/25 underline-offset-2 hover:text-ink"
          >
            {credit}
          </a>
        ) : (
          credit
        )}
      </figcaption>
    </figure>
  );
}
