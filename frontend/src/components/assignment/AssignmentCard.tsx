import { ASSIGNMENT_STATUS } from "@/lib/constants";
import type { Assignment, AssignmentStatus } from "@/types/assignment";

interface AssignmentCardProps {
  assignment: Assignment;
  onClick?: () => void;
}

const statusStyles: Record<AssignmentStatus, string> = {
  [ASSIGNMENT_STATUS.PENDING]: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
  [ASSIGNMENT_STATUS.GENERATING]: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  [ASSIGNMENT_STATUS.COMPLETED]: "bg-green-500/10 text-green-400 ring-green-500/20",
  [ASSIGNMENT_STATUS.FAILED]: "bg-red-500/10 text-red-400 ring-red-500/20",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AssignmentCard({ assignment, onClick }: AssignmentCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-left shadow-sm transition hover:border-zinc-700 hover:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-zinc-100 transition group-hover:text-white">
            {assignment.title}
          </h3>
          <p className="mt-1 truncate text-sm text-zinc-500">{assignment.topic}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[assignment.status]}`}
        >
          {assignment.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Questions</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">
            {assignment.questionConfig.numberOfQuestions}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Created</dt>
          <dd className="mt-0.5 font-medium text-zinc-200">
            {formatDate(assignment.createdAt)}
          </dd>
        </div>
      </dl>
    </button>
  );
}
