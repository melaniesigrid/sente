// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

/* ----------------------- FRIENDS WHO ARE HERE, DRAWN -----------------------
   Three things this can get wrong that reading the source will not catch.

   The first is the empty state, which is the state a small club is in most of
   the time. A heading over nobody is worse than no heading, so there must be
   no card at all rather than a card saying nothing.

   The second is the promise presence makes: nobody is ever drawn as away.
   A friend who is not in the answer is simply not on the strip, whether they
   are out or have chosen not to say, and those two must look the same.

   The third is asking twice. If there is already an invitation in the air
   between these two, the strip must not offer a second board. */

const presence = vi.fn();
const invite = vi.fn();

vi.mock("../net/api.js", () => ({
  api: { presence: (...a) => presence(...a) },
  serverEnabled: () => true,
  SERVER_URL: "https://server.test",
}));

const { HereNow } = await import("./HereNow.jsx");

const person = (id, name) => ({
  id, name, tint: "eucalyptus", rating: 900, rd: 60, wins: 4, losses: 2, draws: 0, avatarAt: null,
});
const BOOK = { friends: [person("p_1", "Ana"), person("p_2", "Bo")], incoming: [], outgoing: [] };
const SHELF = { invites: { incoming: [], outgoing: [] }, busy: null, act: invite };

beforeEach(() => {
  presence.mockReset();
  invite.mockReset();
  presence.mockResolvedValue({ online: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const show = (props = {}) => render(
  <HereNow token="t" book={BOOK} invites={SHELF} size={19} onOpen={() => {}} {...props} />,
);

describe("when nobody is here", () => {
  it("draws no card at all, rather than a heading over nobody", async () => {
    const { container } = show();
    await waitFor(() => expect(presence).toHaveBeenCalled());
    expect(container.querySelector(".here-card")).toBe(null);
  });

  it("draws nothing at all with no friends to ask about", () => {
    const { container } = show({ book: { friends: [], incoming: [], outgoing: [] } });
    expect(container.querySelector(".here-card")).toBe(null);
    expect(presence).not.toHaveBeenCalled();
  });
});

describe("when a friend is here", () => {
  beforeEach(() => { presence.mockResolvedValue({ online: ["p_1"] }); });

  it("draws the one who is, and not the one who is not", async () => {
    show();
    await screen.findByText("Ana");
    expect(screen.queryByText("Bo")).toBe(null);
  });

  it("asks about every friend at once rather than one call a row", async () => {
    show();
    await waitFor(() => expect(presence).toHaveBeenCalled());
    expect(presence).toHaveBeenCalledTimes(1);
    expect(presence).toHaveBeenCalledWith("t", ["p_1", "p_2"]);
  });

  it("offers a game on the board the lobby is set to", async () => {
    show({ size: 9 });
    const ask = await screen.findByRole("button", { name: /9×9/ });
    fireEvent.click(ask);
    expect(invite).toHaveBeenCalledWith("invite", expect.objectContaining({ id: "p_1" }),
      { size: 9, handicap: 0, rated: true });
  });
});

describe("when there is already a question in the air", () => {
  beforeEach(() => { presence.mockResolvedValue({ online: ["p_1"] }); });

  it("offers no second board to somebody already invited", async () => {
    show({ invites: { ...SHELF, invites: { incoming: [], outgoing: [{ to: "p_1", from: "me" }] } } });
    await screen.findByText("Ana");
    expect(screen.queryByRole("button", { name: /19×19/ })).toBe(null);
  });

  it("nor to somebody who has invited you: their card answers that", async () => {
    show({ invites: { ...SHELF, invites: { incoming: [{ from: "p_1", to: "me" }], outgoing: [] } } });
    await screen.findByText("Ana");
    expect(screen.queryByRole("button", { name: /19×19/ })).toBe(null);
  });
});
