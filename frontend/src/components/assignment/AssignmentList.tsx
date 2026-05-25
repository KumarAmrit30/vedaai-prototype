import { AssignmentCard } from "@/components/assignment/AssignmentCard";
import type { Assignment } from "@/types/assignment";

interface AssignmentListProps {
  assignments: Assignment[];
  loading: boolean;
}

export function AssignmentList({ assignments, loading }: AssignmentListProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center">
        <div className="mx-auto mb-3 h-5 w-5 animate-pulse rounded-full bg-zinc-700" />
        <p className="text-sm text-zinc-400">Loading assignments...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center">
        <p className="text-sm font-medium text-zinc-200">No assignments yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Create your first assignment using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {assignments.map((assignment) => (
        <AssignmentCard key={assignment._id} assignment={assignment} />
      ))}
    </div>
  );
}
