import { getPlacePhotoUri, placesEnabled } from "@/lib/google-places";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  if (!placesEnabled()) {
    return new Response("Places is not configured", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  if (!name) {
    return new Response("name is required", { status: 400 });
  }

  try {
    const photoUri = await getPlacePhotoUri(name);
    return Response.redirect(photoUri, 302);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Photo unavailable";
    const status = message === "Invalid photo name" ? 400 : 502;
    return new Response(message, { status });
  }
}
