// The bulk bar needs to represent two very different selections: individual
// ticked rows, or "everything matching the current filter" (which may be far
// more than the loaded page). Model both explicitly.
export type Selection =
  | { mode: "none" }
  | { mode: "ids"; ids: ReadonlySet<string> }
  | { mode: "all"; total: number }

export function emptySelection(): Selection {
  return { mode: "none" }
}

export function selectAllMatching(total: number): Selection {
  return { mode: "all", total }
}

export function toggleRow(selection: Selection, id: string): Selection {
  // Toggling a row off an all-matching selection is not meaningful here; treat a
  // toggle as starting a fresh explicit set from whatever was individually held.
  const ids = new Set(selection.mode === "ids" ? selection.ids : [])
  if (ids.has(id)) ids.delete(id)
  else ids.add(id)
  return ids.size === 0 ? { mode: "none" } : { mode: "ids", ids }
}

export function isRowSelected(selection: Selection, id: string): boolean {
  if (selection.mode === "all") return true
  if (selection.mode === "ids") return selection.ids.has(id)
  return false
}

export function selectionCount(selection: Selection, matchingTotal: number): number {
  if (selection.mode === "all") return selection.total
  if (selection.mode === "ids") return selection.ids.size
  // matchingTotal is accepted so callers can pass the current filter total; an
  // empty selection is still zero.
  void matchingTotal
  return 0
}
