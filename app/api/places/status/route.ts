import { placesEnabled } from "@/lib/google-places";
import type { PlacesStatusResponse } from "@/lib/places-api";

export const dynamic = "force-dynamic";

export function GET(): Response {
  const body: PlacesStatusResponse = { enabled: placesEnabled() };
  return Response.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
