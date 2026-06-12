import { describe, expect, it } from "vitest";
import { RECENT_MESSAGE_LIMIT, shouldCompactHistory } from "../summarizer";

describe("shouldCompactHistory", () => {
  it("is false when the recent-message window isn't full", () => {
    expect(shouldCompactHistory(0)).toBe(false);
    expect(shouldCompactHistory(RECENT_MESSAGE_LIMIT - 1)).toBe(false);
  });

  it("is true once the recent-message window is full (older messages live only in the summary)", () => {
    expect(shouldCompactHistory(RECENT_MESSAGE_LIMIT)).toBe(true);
    expect(shouldCompactHistory(RECENT_MESSAGE_LIMIT + 5)).toBe(true);
  });
});
