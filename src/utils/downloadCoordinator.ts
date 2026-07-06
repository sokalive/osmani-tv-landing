/**
 * Module-scoped single-flight download coordinator.
 * Survives React StrictMode remounts and prevents overlapping fetch/native paths.
 */

let attemptCounter = 0;
let activeAttemptId: number | null = null;
let activeAbort: AbortController | null = null;
let moduleAutoConsumed = false;

export function resetDownloadCoordinator(): void {
  activeAbort?.abort();
  attemptCounter = 0;
  activeAttemptId = null;
  activeAbort = null;
  moduleAutoConsumed = false;
}

export function hasActiveDownloadAttempt(): boolean {
  return activeAttemptId !== null;
}

export function isActiveDownloadAttempt(attemptId: number): boolean {
  return activeAttemptId === attemptId;
}

/** Returns null when another attempt is already in flight. */
export function tryBeginDownloadAttempt():
  | { attemptId: number; signal: AbortSignal }
  | null {
  if (activeAttemptId !== null) return null;

  attemptCounter += 1;
  const attemptId = attemptCounter;
  activeAttemptId = attemptId;
  activeAbort?.abort();
  activeAbort = new AbortController();

  return { attemptId, signal: activeAbort.signal };
}

export function endDownloadAttempt(attemptId: number): void {
  if (activeAttemptId === attemptId) {
    activeAttemptId = null;
    activeAbort = null;
  }
}

export function cancelActiveDownloadAttempt(): void {
  activeAbort?.abort();
  activeAttemptId = null;
  activeAbort = null;
}

/** StrictMode-safe: at most one auto-start per full page load. */
export function consumeModuleAutoStart(): boolean {
  if (moduleAutoConsumed) return false;
  moduleAutoConsumed = true;
  return true;
}
