// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { InvitesCard } from "./InvitesCard.jsx";

afterEach(() => cleanup());

describe("the invitations card", () => {
  it("shows a loading state while the shelf is still being read", () => {
    render(<InvitesCard shelf={{ invites: null, busy: null, act: vi.fn() }} onOpen={() => {}} />);
    expect(screen.getByText("Invitations")).toBeTruthy();
    expect(screen.getByText(/working/i)).toBeTruthy();
  });

  it("stays absent when the loaded shelf is actually empty", () => {
    const { container } = render(
      <InvitesCard shelf={{ invites: { incoming: [], outgoing: [] }, busy: null, act: vi.fn() }} onOpen={() => {}} />,
    );
    expect(container.textContent).toBe("");
  });
});
