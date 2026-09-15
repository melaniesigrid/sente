// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";

const analyseGame = vi.fn();
const analysisCacheKey = vi.fn((record) => String(record.id));
const cachedAnalysis = vi.fn(() => null);
const reviewLength = vi.fn(() => 1);
const t = (key) => key;

vi.mock("../engine/index.js", () => ({
  analyseGame: (...a) => analyseGame(...a),
  analysisCacheKey: (...a) => analysisCacheKey(...a),
  cachedAnalysis: (...a) => cachedAnalysis(...a),
  reviewLength: (...a) => reviewLength(...a),
}));
vi.mock("../components/langStore.js", () => ({ useT: () => t }));

const { useAnalysis } = await import("./useAnalysis.js");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function Probe({ record, auto = false }) {
  const analysis = useAnalysis(record, { auto });
  return (
    <>
      <button type="button" onClick={analysis.start}>start</button>
      <span data-testid="running">{String(analysis.running)}</span>
      <span data-testid="done">{String(analysis.done)}</span>
    </>
  );
}

afterEach(() => {
  cleanup();
  analyseGame.mockReset();
  analysisCacheKey.mockReset();
  analysisCacheKey.mockImplementation((record) => String(record.id));
  cachedAnalysis.mockReset();
  cachedAnalysis.mockReturnValue(null);
  reviewLength.mockReset();
  reviewLength.mockReturnValue(1);
});

describe("useAnalysis", () => {
  it("starts by itself for a finished game when asked", async () => {
    const run = deferred();
    analyseGame.mockReturnValue(run.promise);
    const record = { id: "g1" };

    render(<Probe record={record} auto />);

    await waitFor(() => expect(analyseGame).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("running").textContent).toBe("true");

    const [, opts] = analyseGame.mock.calls[0];
    act(() => {
      opts.onPoint({ move: 0, black: 0.5, color: null, best: null });
    });
    expect(screen.getByTestId("done").textContent).toBe("1");

    run.resolve({ complete: false, reason: "stopped" });
    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  });

  it("does not auto-start the same finished game twice", async () => {
    const record = { id: "g3" };
    analyseGame.mockResolvedValue({ complete: false, reason: "stopped" });

    const shown = render(<Probe record={record} auto />);
    await waitFor(() => expect(analyseGame).toHaveBeenCalledTimes(1));

    shown.rerender(<Probe record={record} auto />);
    await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
    expect(analyseGame).toHaveBeenCalledTimes(1);
  });

  it("stays manual when auto-start is off", async () => {
    analyseGame.mockResolvedValue({ complete: false, reason: "stopped" });

    render(<Probe record={{ id: "g2" }} />);
    expect(analyseGame).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "start" }));
    await waitFor(() => expect(analyseGame).toHaveBeenCalledTimes(1));
  });
});
