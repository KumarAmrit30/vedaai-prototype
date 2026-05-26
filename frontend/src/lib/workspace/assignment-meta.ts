const META_KEY = "veda:assignment-meta";

export interface AssignmentMeta {
  lastOpenedAt?: string;
}

type AssignmentMetaMap = Record<string, AssignmentMeta>;

function readMap(): AssignmentMetaMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AssignmentMetaMap;
  } catch {
    return {};
  }
}

function writeMap(map: AssignmentMetaMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(META_KEY, JSON.stringify(map));
}

export function getAssignmentMeta(id: string): AssignmentMeta {
  return readMap()[id] ?? {};
}

export function getAllAssignmentMeta(): AssignmentMetaMap {
  return readMap();
}

export function markAssignmentOpened(id: string): string {
  const timestamp = new Date().toISOString();
  const map = readMap();
  map[id] = { ...map[id], lastOpenedAt: timestamp };
  writeMap(map);
  return timestamp;
}

export function removeAssignmentMeta(id: string): void {
  const map = readMap();
  delete map[id];
  writeMap(map);
}

export function removeManyAssignmentMeta(ids: string[]): void {
  const map = readMap();
  ids.forEach((id) => delete map[id]);
  writeMap(map);
}

export function getMostRecentlyOpenedId(
  assignmentIds: string[],
): string | null {
  const map = readMap();
  let latestId: string | null = null;
  let latestTime = 0;

  assignmentIds.forEach((id) => {
    const openedAt = map[id]?.lastOpenedAt;
    if (!openedAt) return;
    const time = new Date(openedAt).getTime();
    if (time > latestTime) {
      latestTime = time;
      latestId = id;
    }
  });

  return latestId;
}
