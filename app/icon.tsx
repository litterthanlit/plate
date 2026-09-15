import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3e6c4",
          color: "#1c150f",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        P
      </div>
    ),
    size,
  );
}
