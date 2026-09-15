import type { ListId } from "./types";

export const LISTS: ReadonlyArray<{
  id: ListId;
  label: string;
  hint: string;
}> = [
  { id: "date-night", label: "date night", hint: "worth sharing a table" },
  { id: "cheap", label: "cheap", hint: "good without the bill sting" },
  { id: "solo", label: "solo", hint: "fine to sit at the bar" },
];

export function isListId(value: string): value is ListId {
  return value === "date-night" || value === "cheap" || value === "solo";
}

export function listLabel(id: ListId): string {
  const found = LISTS.find((list) => list.id === id);
  return found?.label ?? id;
}
