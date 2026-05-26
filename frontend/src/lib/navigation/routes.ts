export const ROUTES = {
  home: "/",
  assignments: "/assignments",
  createAssignment: "/assignments/create",
  assignmentDetail: (id: string) => `/assignments/${id}`,
} as const;
