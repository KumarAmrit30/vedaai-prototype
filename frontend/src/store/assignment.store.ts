import { create } from "zustand";
import type { Assignment } from "@/types/assignment";

interface AssignmentState {
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  loading: boolean;
  setAssignments: (assignments: Assignment[]) => void;
  setSelectedAssignment: (assignment: Assignment | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  selectedAssignment: null,
  loading: false,
  setAssignments: (assignments) => set({ assignments }),
  setSelectedAssignment: (selectedAssignment) => set({ selectedAssignment }),
  setLoading: (loading) => set({ loading }),
}));
