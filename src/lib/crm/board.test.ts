import { describe, expect, it } from "vitest"
import { applyOptimisticMove, type BoardColumn } from "./board"

const columns = (): Array<BoardColumn> => [
  {
    stage: { _id: "s1", name: "New", color: "#111" },
    count: 2,
    cards: [
      { _id: "c1", membershipId: "m1", name: "Ada" },
      { _id: "c2", membershipId: "m2", name: "Bob" },
    ],
  },
  {
    stage: { _id: "s2", name: "Won", color: "#222" },
    count: 0,
    cards: [],
  },
]

describe("applyOptimisticMove", () => {
  it("moves the card to the target stage and shifts counts", () => {
    const next = applyOptimisticMove(columns(), "m1", "s2")
    const from = next.find((c) => c.stage._id === "s1")!
    const to = next.find((c) => c.stage._id === "s2")!
    expect(from.count).toBe(1)
    expect(from.cards.map((k) => k.membershipId)).toEqual(["m2"])
    expect(to.count).toBe(1)
    expect(to.cards[0].membershipId).toBe("m1")
  })

  it("leaves columns unchanged when the membership isn't found", () => {
    const start = columns()
    expect(applyOptimisticMove(start, "nope", "s2")).toEqual(start)
  })

  it("leaves columns unchanged when already in the target stage", () => {
    const start = columns()
    expect(applyOptimisticMove(start, "m1", "s1")).toEqual(start)
  })
})
