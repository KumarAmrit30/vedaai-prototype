import { create } from "zustand";
import type { Assignment } from "@/types/assignment";

interface AssignmentState {
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  loading: boolean;
  loadedOnce: boolean;
  setAssignments: (assignments: Assignment[]) => void;
  setSelectedAssignment: (assignment: Assignment | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadedOnce: (loadedOnce: boolean) => void;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  removeAssignmentsById: (ids: string[]) => Assignment[];
  restoreAssignments: (assignments: Assignment[]) => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  selectedAssignment: null,
  loading: false,
  loadedOnce: false,
  setAssignments: (assignments) =>
    set({
      assignments: Array.isArray(assignments) ? assignments : [],
      loadedOnce: true,
    }),
  setSelectedAssignment: (selectedAssignment) => set({ selectedAssignment }),
  setLoading: (loading) => set({ loading }),
  setLoadedOnce: (loadedOnce) => set({ loadedOnce }),
  updateAssignment: (id, patch) =>
    set({
      assignments: get().assignments.map((item) =>
        item._id === id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item,
      ),
    }),
  removeAssignmentsById: (ids) => {
    const idSet = new Set(ids.filter(Boolean));
    const current = get().assignments;
    const removed = current.filter((item) => idSet.has(item._id));

    set({
      assignments: current.filter((item) => !idSet.has(item._id)),
    });

    return removed;
  },
  restoreAssignments: (assignments) => {
    const safeAssignments = Array.isArray(assignments) ? assignments : [];
    if (safeAssignments.length === 0) return;

    const existingIds = new Set(get().assignments.map((item) => item._id));
    const toRestore = safeAssignments.filter((item) => !existingIds.has(item._id));

    if (toRestore.length === 0) return;

    set({
      assignments: [...toRestore, ...get().assignments].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    });
  },
}));
