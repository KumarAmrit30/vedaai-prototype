export type AssignmentSortOrder = "recent" | "oldest" | "title";

export interface WorkspacePreferences {
  autoSave: boolean;
  showAnalyticsWidgets: boolean;
  sortOrder: AssignmentSortOrder;
}

export const WORKSPACE_PREFERENCES_KEY = "examforge-workspace-preferences";

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  autoSave: true,
  showAnalyticsWidgets: true,
  sortOrder: "recent",
};

export function readWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(WORKSPACE_PREFERENCES_KEY);
    if (!raw) return DEFAULT_WORKSPACE_PREFERENCES;
    return { ...DEFAULT_WORKSPACE_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_WORKSPACE_PREFERENCES;
  }
}

export function writeWorkspacePreferences(
  preferences: WorkspacePreferences,
): void {
  window.localStorage.setItem(
    WORKSPACE_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}
