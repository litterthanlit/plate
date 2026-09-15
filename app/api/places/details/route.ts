import { getPlaceDetails, placesEnabled } from "@/lib/google-places";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!placesEnabled()) {
    return Response.json(
      { error: "Places is not configured" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId") ?? "";
  const session = searchParams.get("session") ?? undefined;
  if (!placeId) {
    return Response.json(
      { error: "placeId is required" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const body = await getPlaceDetails(placeId, session);
    return Response.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load that place";
    const status = message === "Invalid place id" ? 400 : 502;
    return Response.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
