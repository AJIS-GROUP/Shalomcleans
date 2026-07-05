import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PromptDialog } from "./dialogs"

describe("PromptDialog", () => {
  it("renders its title and submits the trimmed value", () => {
    const onSubmit = vi.fn()
    render(
      <PromptDialog
        title="New campaign"
        label="Campaign name"
        submitLabel="Create"
        onSubmit={onSubmit}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText("New campaign")).toBeTruthy()
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "  Miami cold  " } })
    fireEvent.submit(input.closest("form")!)

    expect(onSubmit).toHaveBeenCalledWith("Miami cold")
  })

  it("does not submit an empty or whitespace value", () => {
    const onSubmit = vi.fn()
    render(
      <PromptDialog
        title="New campaign"
        label="Campaign name"
        submitLabel="Create"
        onSubmit={onSubmit}
        onClose={() => {}}
      />,
    )
    const input = screen.getByRole("textbox")
    fireEvent.change(input, { target: { value: "   " } })
    fireEvent.submit(input.closest("form")!)

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
