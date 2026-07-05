import { createPortal } from "react-dom"
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvided,
  type DropResult,
} from "@hello-pangea/dnd"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { applyOptimisticMove } from "#/lib/crm/board"
import { contactDisplayName } from "#/lib/crm/display"

type Card = {
  _id: Id<"contacts">
  membershipId?: string
  name?: string
  company?: string
  email?: string
  phone?: string
  tags?: Array<string>
}

export function Board({
  campaignId,
  onOpenContact,
}: {
  campaignId: Id<"campaigns">
  onOpenContact: (contactId: Id<"contacts">) => void
}) {
  const columns = useQuery(api.crmQueries.boardColumns, { campaignId })
  // Optimistic: the card jumps columns instantly, before the server round-trip.
  const moveStage = useMutation(api.crmMutations.moveStage).withOptimisticUpdate(
    (store, { membershipId, stageId }) => {
      const current = store.getQuery(api.crmQueries.boardColumns, { campaignId })
      if (!current) return
      store.setQuery(
        api.crmQueries.boardColumns,
        { campaignId },
        applyOptimisticMove(current, membershipId, stageId),
      )
    },
  )

  const onDragEnd = (result: DropResult) => {
    const { draggableId, destination, source } = result
    if (!destination || destination.droppableId === source.droppableId) return
    void moveStage({
      membershipId: draggableId as Id<"memberships">,
      stageId: destination.droppableId as Id<"stages">,
    })
  }

  if (columns === undefined) {
    return <div className="text-white/30 text-xs py-10 text-center">Loading…</div>
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <Droppable
            droppableId={col.stage._id}
            key={col.stage._id}
            // Render the dragged clone into a body portal so a transformed
            // ancestor (the admin frame / Reveal wrapper) can't offset it.
            renderClone={(provided, _snapshot, rubric) =>
              createPortal(
                <CardBody
                  provided={provided}
                  card={col.cards[rubric.source.index] as Card}
                  dragging
                />,
                document.body,
              )
            }
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`w-72 shrink-0 rounded-2xl border p-2 transition-colors ${
                  snapshot.isDraggingOver
                    ? "border-[#c4f54a]/40 bg-[#c4f54a]/5"
                    : "border-white/5 bg-[#101012]"
                }`}
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-white">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: col.stage.color }}
                    />
                    {col.stage.name}
                  </span>
                  <span className="text-[10px] text-white/40">{col.count}</span>
                </div>

                <div className="space-y-2 min-h-[40px]">
                  {col.cards.map((card, index) => (
                    <Draggable
                      draggableId={card.membershipId!}
                      index={index}
                      key={card.membershipId}
                    >
                      {(dp) => (
                        <CardBody
                          provided={dp}
                          card={card as Card}
                          onOpen={() => onOpenContact(card._id)}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {col.cards.length === 0 && (
                    <div className="text-[10px] text-white/20 text-center py-4">
                      Empty
                    </div>
                  )}
                </div>
                {col.count > col.cards.length && (
                  <div className="text-[10px] text-white/30 text-center pt-2">
                    +{col.count - col.cards.length} more — use the table to see all
                  </div>
                )}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}

function CardBody({
  provided,
  card,
  onOpen,
  dragging,
}: {
  provided: DraggableProvided
  card: Card
  onOpen?: () => void
  dragging?: boolean
}) {
  const title = contactDisplayName(card)
  const secondary = [card.email, card.phone].find((v) => v && v !== title)
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onOpen}
      className={`rounded-xl bg-[#1a1a1c] border p-3 cursor-pointer ${
        dragging
          ? "border-[#c4f54a]/60 shadow-2xl"
          : "border-white/5 hover:border-white/15"
      }`}
    >
      <div className="text-sm text-white truncate">{title}</div>
      {secondary && (
        <div className="text-[11px] text-white/40 truncate">{secondary}</div>
      )}
      {(card.tags ?? []).length > 0 && (
        <div className="flex gap-1 flex-wrap mt-1.5">
          {(card.tags ?? []).slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[9px] rounded-full bg-white/10 text-white/60 px-1.5 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
