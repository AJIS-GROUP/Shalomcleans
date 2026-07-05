import { useMutation, useQuery } from "convex/react"
import { X, Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { api } from "../../../../convex/_generated/api"
import type { Doc, Id } from "../../../../convex/_generated/dataModel"

type StageType = "active" | "won" | "lost"

export function StageEditor({
  campaignId,
  onClose,
}: {
  campaignId: Id<"campaigns">
  onClose: () => void
}) {
  const stages = useQuery(api.crmQueries.listStages, { campaignId })
  const addStage = useMutation(api.crmMutations.addStage)
  const updateStage = useMutation(api.crmMutations.updateStage)
  const reorderStages = useMutation(api.crmMutations.reorderStages)
  const deleteStage = useMutation(api.crmMutations.deleteStage)

  const move = (index: number, dir: -1 | 1) => {
    if (!stages) return
    const target = index + dir
    if (target < 0 || target >= stages.length) return
    const ids = stages.map((s) => s._id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    void reorderStages({ orderedIds: ids })
  }

  const remove = (stage: Doc<"stages">) => {
    if (!stages) return
    const others = stages.filter((s) => s._id !== stage._id)
    if ((stage.count ?? 0) > 0) {
      if (others.length === 0) {
        window.alert("Add another stage before deleting the only one with contacts.")
        return
      }
      const target = others[0]
      if (
        !window.confirm(
          `Move ${stage.count} contacts to "${target.name}" and delete "${stage.name}"?`,
        )
      )
        return
      void deleteStage({ stageId: stage._id, reassignToStageId: target._id })
    } else {
      void deleteStage({ stageId: stage._id })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1a1a1c] border border-white/10 rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg">Pipeline stages</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 inline-flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {stages?.map((stage, i) => (
            <div
              key={stage._id}
              className="flex items-center gap-2 bg-[#101012] border border-white/5 rounded-xl px-2.5 py-2"
            >
              <input
                type="color"
                value={stage.color}
                onChange={(e) =>
                  updateStage({ stageId: stage._id, color: e.target.value })
                }
                className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                defaultValue={stage.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== stage.name)
                    updateStage({ stageId: stage._id, name: e.target.value })
                }}
                className="flex-1 min-w-0 bg-transparent text-sm text-white focus:outline-none"
              />
              <select
                value={stage.type}
                onChange={(e) =>
                  updateStage({
                    stageId: stage._id,
                    type: e.target.value as StageType,
                  })
                }
                className="bg-[#0e0e0f] border border-white/10 rounded-lg text-[11px] text-white/70 px-1.5 py-1"
              >
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
              <span className="text-[10px] text-white/30 w-8 text-right">
                {stage.count ?? 0}
              </span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-6 h-6 rounded hover:bg-white/10 inline-flex items-center justify-center disabled:opacity-20"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === (stages?.length ?? 0) - 1}
                className="w-6 h-6 rounded hover:bg-white/10 inline-flex items-center justify-center disabled:opacity-20"
              >
                <ArrowDown size={12} />
              </button>
              <button
                onClick={() => remove(stage)}
                className="w-6 h-6 rounded hover:bg-red-500/20 text-red-300 inline-flex items-center justify-center"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            addStage({
              campaignId,
              name: "New stage",
              color: "#8b9cff",
              type: "active",
            })
          }
          className="mt-4 inline-flex items-center gap-2 text-xs text-white/70 border border-white/10 rounded-full px-4 py-2 hover:bg-white/5 transition-colors"
        >
          <Plus size={13} /> Add stage
        </button>
      </div>
    </div>
  )
}
