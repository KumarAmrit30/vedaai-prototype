import { create } from "zustand";
import {
  getSortPreference,
  setSortPreference,
  type SortOption,
} from "@/lib/workspace/sort-preference";

interface WorkspaceState {
  sortOption: SortOption;
  selectedIds: string[];
  selectionMode: boolean;
  recentlyOpenedHighlightId: string | null;
  setSortOption: (option: SortOption) => void;
  hydrateSortOption: () => void;
  setSelectionMode: (active: boolean) => void;
  toggleSelected: (id: string) => void;
  selectOnly: (id: string) => void;
  selectRange: (ids: string[], anchorId: string, targetId: string) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;
  setRecentlyOpenedHighlightId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  sortOption: "newest",
  selectedIds: [],
  selectionMode: false,
  recentlyOpenedHighlightId: null,

  setSortOption: (option) => {
    setSortPreference(option);
    set({ sortOption: option });
  },

  hydrateSortOption: () => {
    set({ sortOption: getSortPreference() });
  },

  setSelectionMode: (active) =>
    set({ selectionMode: active, selectedIds: active ? get().selectedIds : [] }),

  toggleSelected: (id) => {
    const current = get().selectedIds;
    set({
      selectedIds: current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
      selectionMode: true,
    });
  },

  selectOnly: (id) => set({ selectedIds: [id], selectionMode: true }),

  selectRange: (ids, anchorId, targetId) => {
    const anchorIndex = ids.indexOf(anchorId);
    const targetIndex = ids.indexOf(targetId);
    if (anchorIndex === -1 || targetIndex === -1) return;

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    set({
      selectedIds: ids.slice(start, end + 1),
      selectionMode: true,
    });
  },

  clearSelection: () => set({ selectedIds: [], selectionMode: false }),

  setSelectedIds: (ids) => set({ selectedIds: ids, selectionMode: ids.length > 0 }),

  setRecentlyOpenedHighlightId: (id) => set({ recentlyOpenedHighlightId: id }),
}));
