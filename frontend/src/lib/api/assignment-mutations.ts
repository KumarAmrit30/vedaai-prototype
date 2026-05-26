import apiClient from "@/lib/api/axios";
import type { Assignment } from "@/types/assignment";

export type ManualAssignmentStatus = "pending" | "completed" | "failed";

interface AssignmentResponse {
  success: boolean;
  data: Assignment;
}

interface DeleteResponse {
  success: boolean;
  assignmentId: string;
}

interface BulkStatusResponse {
  success: boolean;
  data: Assignment[];
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete<DeleteResponse>(`/assignments/${id}`);
}

export async function bulkDeleteAssignments(ids: string[]): Promise<void> {
  await apiClient.post("/assignments/bulk-delete", { assignmentIds: ids });
}

export async function persistAssignmentDeletes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  if (ids.length === 1) {
    await deleteAssignment(ids[0]!);
    return;
  }

  await bulkDeleteAssignments(ids);
}

export async function patchAssignmentStatus(
  id: string,
  status: ManualAssignmentStatus,
): Promise<Assignment> {
  const response = await apiClient.patch<AssignmentResponse>(
    `/assignments/${id}/status`,
    { status },
  );

  return response.data.data;
}

export async function bulkUpdateAssignmentStatus(
  assignmentIds: string[],
  status: ManualAssignmentStatus,
): Promise<Assignment[]> {
  const response = await apiClient.post<BulkStatusResponse>(
    "/assignments/bulk-status",
    { assignmentIds, status },
  );

  return response.data.data;
}
