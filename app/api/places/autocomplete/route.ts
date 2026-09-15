import { autocompletePlaces } from "@/lib/google-places";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const session = searchParams.get("session") ?? undefined;

  try {
    const body = await autocompletePlaces(query, session);
    return Response.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Place search failed";
    return Response.json(
      { enabled: true, suggestions: [], error: message },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
