export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
};

export type PlacesStatusResponse = {
  enabled: boolean;
};

export type AutocompleteResponse = {
  enabled: boolean;
  suggestions: PlaceSuggestion[];
};

export type PlaceDetailsResponse = {
  placeId: string;
  name: string;
  address: string;
  neighborhood: string;
  cuisine: string;
  lat?: number;
  lng?: number;
  photoName?: string;
  photoAttribution?: string;
  photoAttributionUri?: string;
};

export function isPlaceSuggestion(value: unknown): value is PlaceSuggestion {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.placeId === "string" &&
    record.placeId.length > 0 &&
    typeof record.name === "string" &&
    record.name.length > 0 &&
    typeof record.address === "string"
  );
}
