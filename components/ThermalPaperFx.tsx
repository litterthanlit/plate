/** Landing-only paper surface. Diary screens stay on the plain `.receipt` sheet. */
export function ThermalPaperFx() {
  return (
    <div className="thermal-fx" aria-hidden="true">
      <svg
        className="thermal-fx__svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter
            id="thermal-valleys"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.011 0.011"
              numOctaves={4}
              seed={11}
              result="noise"
            />
            <feDiffuseLighting
              in="noise"
              lightingColor="#fff8f0"
              surfaceScale={2.4}
              result="lit"
            >
              <feDistantLight azimuth={42} elevation={55} />
            </feDiffuseLighting>
          </filter>
          <filter
            id="thermal-ridges"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.016 0.016"
              numOctaves={3}
              seed={19}
              result="noise"
            />
            <feSpecularLighting
              in="noise"
              lightingColor="#fffef8"
              surfaceScale={1.5}
              specularConstant={0.8}
              specularExponent={16}
              result="spec"
            >
              <feDistantLight azimuth={130} elevation={48} />
            </feSpecularLighting>
          </filter>
          <filter
            id="thermal-wrinkle"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.012"
              numOctaves={2}
              seed={4}
              result="warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="warp"
              scale={8}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="1.2" />
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
              baseFrequency="0.65"
              numOctaves={4}
              seed={5}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix in="noise" type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          className="thermal-fx__valleys"
          width="400"
          height="400"
          filter="url(#thermal-valleys)"
        />
        <rect
          className="thermal-fx__ridges"
          width="400"
          height="400"
          filter="url(#thermal-ridges)"
        />
        <g className="thermal-fx__wrinkles" filter="url(#thermal-wrinkle)">
          <path
            d="M-20 56 C 110 24, 230 80, 420 36"
            fill="none"
            stroke="#fffdf8"
            strokeWidth="2.1"
          />
          <path
            d="M-40 168 C 120 196, 260 140, 440 180"
            fill="none"
            stroke="#fffdf8"
            strokeWidth="1.7"
          />
          <path
            d="M-20 328 C 150 356, 270 300, 420 340"
            fill="none"
            stroke="#fffdf8"
            strokeWidth="1.9"
          />
        </g>
        <rect
          className="thermal-fx__grain"
          width="400"
          height="400"
          filter="url(#thermal-grain)"
        />
      </svg>
      <div className="thermal-fx__wash" />
    </div>
  );
}
