// Structural shapes for the optimistic updater. Generic so the concrete Convex
// board-query type flows through unchanged (no index-signature coupling).
export type BoardCard = { membershipId?: string }
export type BoardColumn = {
  stage: { _id: string; name: string; color: string }
  count: number
  cards: Array<{ _id: string; membershipId?: string; name?: string }>
}

/**
 * Pure optimistic move: remove the dragged card from its source stage and
 * prepend it to the target, shifting the two counts. Returns the input
 * unchanged if the membership can't be found or is already in the target.
 */
export function applyOptimisticMove<
  Card extends BoardCard,
  Col extends { stage: { _id: string }; count: number; cards: Array<Card> },
>(columns: Array<Col>, membershipId: string, targetStageId: string): Array<Col> {
  let fromStageId: string | undefined
  let card: Card | undefined
  for (const col of columns) {
    const found = col.cards.find((k) => k.membershipId === membershipId)
    if (found) {
      card = found
      fromStageId = col.stage._id
      break
    }
  }
  if (card === undefined || fromStageId === undefined) return columns
  if (fromStageId === targetStageId) return columns

  const moved = card
  return columns.map((col) => {
    if (col.stage._id === fromStageId) {
      return {
        ...col,
        count: Math.max(0, col.count - 1),
        cards: col.cards.filter((k) => k.membershipId !== membershipId),
      }
    }
    if (col.stage._id === targetStageId) {
      return { ...col, count: col.count + 1, cards: [moved, ...col.cards] }
    }
    return col
  })
}
