export type SortOption = "newest" | "oldest" | "recently-opened" | "alphabetical";

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "recently-opened", label: "Recently Opened" },
  { id: "alphabetical", label: "Alphabetical" },
];

const SORT_KEY = "veda:assignment-sort";

export function getSortPreference(): SortOption {
  if (typeof window === "undefined") return "newest";

  const stored = localStorage.getItem(SORT_KEY);
  if (
    stored === "newest" ||
    stored === "oldest" ||
    stored === "recently-opened" ||
    stored === "alphabetical"
  ) {
    return stored;
  }

  return "newest";
}

export function setSortPreference(option: SortOption): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SORT_KEY, option);
}
