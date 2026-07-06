import { describe, expect, it, beforeEach } from "vitest";
import {
  cancelActiveDownloadAttempt,
  consumeModuleAutoStart,
  endDownloadAttempt,
  hasActiveDownloadAttempt,
  isActiveDownloadAttempt,
  resetDownloadCoordinator,
  tryBeginDownloadAttempt,
} from "./downloadCoordinator";

describe("downloadCoordinator", () => {
  beforeEach(() => {
    resetDownloadCoordinator();
  });

  it("allows only one active attempt at a time", () => {
    const first = tryBeginDownloadAttempt();
    expect(first).not.toBeNull();
    expect(hasActiveDownloadAttempt()).toBe(true);
    expect(tryBeginDownloadAttempt()).toBeNull();
  });

  it("releases lock after endAttempt", () => {
    const first = tryBeginDownloadAttempt()!;
    endDownloadAttempt(first.attemptId);
    expect(hasActiveDownloadAttempt()).toBe(false);
    expect(tryBeginDownloadAttempt()).not.toBeNull();
  });

  it("stale attempt cannot own state after end", () => {
    const first = tryBeginDownloadAttempt()!;
    const staleId = first.attemptId;
    endDownloadAttempt(staleId);
    expect(isActiveDownloadAttempt(staleId)).toBe(false);
  });

  it("cancelActiveDownloadAttempt clears active attempt", () => {
    tryBeginDownloadAttempt();
    cancelActiveDownloadAttempt();
    expect(hasActiveDownloadAttempt()).toBe(false);
  });

  it("consumeModuleAutoStart runs at most once per page load", () => {
    expect(consumeModuleAutoStart()).toBe(true);
    expect(consumeModuleAutoStart()).toBe(false);
  });

  it("retry creates a new attempt after prior terminal", () => {
    const a = tryBeginDownloadAttempt()!;
    endDownloadAttempt(a.attemptId);
    const b = tryBeginDownloadAttempt()!;
    expect(b.attemptId).toBeGreaterThan(a.attemptId);
  });
});
