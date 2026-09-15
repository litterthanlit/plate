/** Landing-only paper surface. Diary screens stay on the plain `.receipt` sheet. */
export function ThermalPaperFx() {
  return (
    <div className="thermal-fx" aria-hidden="true">
      <svg
        className="thermal-fx__svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <filter
            id="thermal-crumple"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.016"
              numOctaves={3}
              seed={14}
              result="folds"
            />
            <feDiffuseLighting
              in="folds"
              lightingColor="#fff8f0"
              surfaceScale={3.8}
              result="lit"
            >
              <feDistantLight azimuth={122} elevation={54} />
            </feDiffuseLighting>
          </filter>
          <filter
            id="thermal-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves={4}
              seed={5}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="mono"
            />
          </filter>
        </defs>
        <rect
          className="thermal-fx__crumple"
          width="100"
          height="100"
          filter="url(#thermal-crumple)"
        />
        <rect
          className="thermal-fx__grain"
          width="100"
          height="100"
          filter="url(#thermal-grain)"
        />
      </svg>
      <div className="thermal-fx__folds" />
    </div>
  );
}
