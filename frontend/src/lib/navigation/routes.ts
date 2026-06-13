export const ROUTES = {
  home: "/",
  assignments: "/assignments",
  createAssignment: "/assignments/create",
  assignmentDetail: (id: string) => `/assignments/${id}`,
  library: "/library",
  groups: "/groups",
  notifications: "/notifications",
  upgrade: "/upgrade",
  settings: "/settings",
} as const;
