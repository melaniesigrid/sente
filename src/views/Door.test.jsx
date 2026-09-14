// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { webcrypto } from "node:crypto";

/* ----------------------- THE DOOR, FROM THE STEP -----------------------
   Three things a unit test of the hash cannot see: a wrong answer is said and
   the door stays shut; a right answer opens it and the device is remembered;
   correcting a wrong answer clears the red line before the next try.

   The real password is not typed here. `opensDoor` is stood in for by one that
   opens on "abc", so the screen is tested against a known answer without the
   test file becoming the place the password is written down. */

vi.mock("../store/door.js", async (load) => {
  const real = await load();
  const ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
  return { ...real, opensDoor: (text) => real.digestOf(real.tidyPassword(text)).then(d => d === ABC) };
});

const { DoorView } = await import("./Door.jsx");
const { DOOR_KEY, DOOR_DIGEST } = await import("../store/door.js");

let hadCrypto;
beforeEach(() => {
  hadCrypto = globalThis.crypto;
  if (!hadCrypto || !hadCrypto.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  Object.defineProperty(globalThis, "crypto", { value: hadCrypto, configurable: true });
});

describe("DoorView", () => {
  it("stays shut on a wrong answer and says so", async () => {
    const onOpen = vi.fn();
    render(<DoorView onOpen={onOpen} />);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "xyz" } });
    fireEvent.click(screen.getByRole("button", { name: /enter/i }));
    await screen.findByRole("alert");
    expect(onOpen).not.toHaveBeenCalled();
    expect(localStorage.getItem(DOOR_KEY)).toBe(null);
    // Correcting the answer takes the red line away before the next try.
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "xy" } });
    expect(screen.queryByRole("alert")).toBe(null);
  });

  it("opens on the right answer, on Enter, and remembers the device", async () => {
    const onOpen = vi.fn();
    render(<DoorView onOpen={onOpen} />);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: " ABC " } });
    fireEvent.keyDown(screen.getByLabelText("Password"), { key: "Enter" });
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem(DOOR_KEY)).toBe(DOOR_DIGEST);
  });

  it("does nothing with an empty field", () => {
    render(<DoorView onOpen={() => {}} />);
    expect(screen.getByRole("button", { name: /enter/i }).disabled).toBe(true);
  });
});
