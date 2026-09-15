import { METRO } from "./places";
import type {
  AutocompleteResponse,
  PlaceDetailsResponse,
  PlaceSuggestion,
} from "./places-api";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACE_URL = "https://places.googleapis.com/v1/places";
const PHOTO_MEDIA = "media";

const AUTOCOMPLETE_MASK = [
  "suggestions.placePrediction.placeId",
  "suggestions.placePrediction.types",
  "suggestions.placePrediction.structuredFormat.mainText.text",
  "suggestions.placePrediction.structuredFormat.secondaryText.text",
  "suggestions.placePrediction.text.text",
].join(",");

const DETAILS_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "addressComponents",
  "photos",
  "types",
  "primaryType",
  "primaryTypeDisplayName",
].join(",");

const SKIP_TYPES = new Set([
  "administrative_area_level_1",
  "administrative_area_level_2",
  "country",
  "locality",
  "political",
  "plus_code",
  "postal_code",
  "route",
]);

export const PORTLAND_CENTER = {
  latitude: 45.5152,
  longitude: -122.6784,
} as const;

const PORTLAND_RADIUS_METERS = 50_000;
const QUERY_MAX = 80;
const GOOGLE_TIMEOUT_MS = 8_000;

export const PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/;
export const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,256}$/;
export const SESSION_PATTERN = /^[A-Za-z0-9-]{8,36}$/;

export function getPlacesApiKey(): string | undefined {
  const key =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

export function placesEnabled(): boolean {
  return Boolean(getPlacesApiKey());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.length > 0) out.push(item);
  }
  return out;
}

export function clampQuery(raw: string): string {
  return raw.trim().slice(0, QUERY_MAX);
}

export function isUsefulPlaceTypes(types: readonly string[]): boolean {
  if (types.length === 0) return true;
  return types.some((type) => !SKIP_TYPES.has(type));
}

async function googleFetch(
  url: string,
  init: RequestInit & { fieldMask?: string },
): Promise<Response> {
  const key = getPlacesApiKey();
  if (!key) {
    throw new Error("Places API key is not configured");
  }
  const headers = new Headers(init.headers);
  headers.set("X-Goog-Api-Key", key);
  headers.set("Content-Type", "application/json");
  if (init.fieldMask) {
    headers.set("X-Goog-FieldMask", init.fieldMask);
  }
  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
  });
}

async function readGoogleJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Google Places returned invalid JSON");
  }
}

function googleErrorMessage(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  const error = asRecord(record?.error);
  return asString(error?.message) ?? fallback;
}

function parseSuggestion(value: unknown): PlaceSuggestion | null {
  const row = asRecord(value);
  const prediction = asRecord(row?.placePrediction);
  if (!prediction) return null;
  const placeId = asString(prediction.placeId);
  if (!placeId || !PLACE_ID_PATTERN.test(placeId)) return null;
  if (!isUsefulPlaceTypes(asStringArray(prediction.types))) return null;

  const structured = asRecord(prediction.structuredFormat);
  const main = asRecord(structured?.mainText);
  const secondary = asRecord(structured?.secondaryText);
  const text = asRecord(prediction.text);
  const name =
    asString(main?.text) ?? asString(text?.text)?.split(",")[0]?.trim();
  if (!name) return null;
  const address =
    asString(secondary?.text) ??
    asString(text?.text) ??
    "";
  return { placeId, name, address };
}

export async function autocompletePlaces(
  input: string,
  sessionToken?: string,
): Promise<AutocompleteResponse> {
  if (!placesEnabled()) {
    return { enabled: false, suggestions: [] };
  }
  const query = clampQuery(input);
  if (query.length < 2) {
    return { enabled: true, suggestions: [] };
  }

  const body: Record<string, unknown> = {
    input: query,
    languageCode: "en",
    regionCode: "us",
    includedRegionCodes: ["us"],
    includeQueryPredictions: false,
    locationBias: {
      circle: {
        center: PORTLAND_CENTER,
        radius: PORTLAND_RADIUS_METERS,
      },
    },
  };
  if (sessionToken && SESSION_PATTERN.test(sessionToken)) {
    body.sessionToken = sessionToken;
  }

  const response = await googleFetch(AUTOCOMPLETE_URL, {
    method: "POST",
    fieldMask: AUTOCOMPLETE_MASK,
    body: JSON.stringify(body),
  });
  const payload = await readGoogleJson(response);
  if (!response.ok) {
    console.error("Places autocomplete failed", response.status);
    throw new Error(googleErrorMessage(payload, "Place search failed"));
  }

  const record = asRecord(payload);
  const rawSuggestions = Array.isArray(record?.suggestions)
    ? record.suggestions
    : [];
  const suggestions: PlaceSuggestion[] = [];
  const seen = new Set<string>();
  for (const item of rawSuggestions) {
    const suggestion = parseSuggestion(item);
    if (!suggestion || seen.has(suggestion.placeId)) continue;
    seen.add(suggestion.placeId);
    suggestions.push(suggestion);
    if (suggestions.length >= 8) break;
  }
  return { enabled: true, suggestions };
}

function neighborhoodFromComponents(components: unknown): string {
  if (!Array.isArray(components)) return METRO;
  const byType = (type: string): string | undefined => {
    for (const item of components) {
      const row = asRecord(item);
      if (!row) continue;
      if (asStringArray(row.types).includes(type)) {
        return asString(row.longText) ?? asString(row.shortText);
      }
    }
    return undefined;
  };
  return (
    byType("neighborhood") ||
    byType("sublocality_level_1") ||
    byType("sublocality") ||
    byType("locality") ||
    METRO
  );
}

function cuisineFromPlace(record: Record<string, unknown>): string {
  const primaryName = asRecord(record.primaryTypeDisplayName);
  const labeled = asString(primaryName?.text);
  if (labeled) return labeled.toLowerCase();
  const primary = asString(record.primaryType);
  if (primary) return primary.replace(/_/g, " ");
  const types = asStringArray(record.types);
  const interesting = types.find(
    (type) =>
      !SKIP_TYPES.has(type) &&
      type !== "point_of_interest" &&
      type !== "establishment" &&
      type !== "food",
  );
  return interesting ? interesting.replace(/_/g, " ") : "place";
}

function firstPhoto(record: Record<string, unknown>): {
  photoName?: string;
  photoAttribution?: string;
  photoAttributionUri?: string;
} {
  if (!Array.isArray(record.photos) || record.photos.length === 0) {
    return {};
  }
  const photo = asRecord(record.photos[0]);
  if (!photo) return {};
  const photoName = asString(photo.name);
  if (!photoName || !PHOTO_NAME_PATTERN.test(photoName)) return {};

  const attributions = Array.isArray(photo.authorAttributions)
    ? photo.authorAttributions
    : [];
  const names: string[] = [];
  let uri: string | undefined;
  for (const item of attributions) {
    const row = asRecord(item);
    const displayName = asString(row?.displayName);
    if (displayName) names.push(displayName);
    if (!uri) {
      const rawUri = asString(row?.uri);
      if (rawUri) {
        uri = rawUri.startsWith("//") ? `https:${rawUri}` : rawUri;
      }
    }
  }
  return {
    photoName,
    photoAttribution: names.length > 0 ? names.join(", ") : undefined,
    photoAttributionUri: uri,
  };
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetailsResponse> {
  if (!PLACE_ID_PATTERN.test(placeId)) {
    throw new Error("Invalid place id");
  }
  const url = new URL(`${PLACE_URL}/${encodeURIComponent(placeId)}`);
  if (sessionToken && SESSION_PATTERN.test(sessionToken)) {
    url.searchParams.set("sessionToken", sessionToken);
  }

  const response = await googleFetch(url.toString(), {
    method: "GET",
    fieldMask: DETAILS_MASK,
  });
  const payload = await readGoogleJson(response);
  if (!response.ok) {
    console.error("Places details failed", response.status);
    throw new Error(googleErrorMessage(payload, "Could not load that place"));
  }

  const record = asRecord(payload);
  if (!record) {
    throw new Error("Could not load that place");
  }
  const id = asString(record.id) ?? placeId;
  const displayName = asRecord(record.displayName);
  const name = asString(displayName?.text);
  const address =
    asString(record.formattedAddress) ??
    asString(record.shortFormattedAddress);
  if (!name || !address) {
    throw new Error("That place is missing a name or address");
  }

  const location = asRecord(record.location);
  const lat = asNumber(location?.latitude);
  const lng = asNumber(location?.longitude);
  const photo = firstPhoto(record);

  const details: PlaceDetailsResponse = {
    placeId: id,
    name,
    address,
    neighborhood: neighborhoodFromComponents(record.addressComponents),
    cuisine: cuisineFromPlace(record),
    ...photo,
  };
  if (lat !== undefined && lng !== undefined) {
    details.lat = lat;
    details.lng = lng;
  }
  return details;
}

export async function getPlacePhotoUri(photoName: string): Promise<string> {
  if (!PHOTO_NAME_PATTERN.test(photoName)) {
    throw new Error("Invalid photo name");
  }
  const url = new URL(
    `https://places.googleapis.com/v1/${photoName}/${PHOTO_MEDIA}`,
  );
  url.searchParams.set("maxWidthPx", "160");
  url.searchParams.set("maxHeightPx", "160");
  url.searchParams.set("skipHttpRedirect", "true");

  const response = await googleFetch(url.toString(), { method: "GET" });
  const payload = await readGoogleJson(response);
  if (!response.ok) {
    console.error("Places photo failed", response.status);
    throw new Error(googleErrorMessage(payload, "Photo unavailable"));
  }
  const record = asRecord(payload);
  const photoUri = asString(record?.photoUri);
  if (!photoUri) {
    throw new Error("Photo unavailable");
  }
  return photoUri;
}
