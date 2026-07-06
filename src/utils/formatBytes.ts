/** Decimal megabytes (matches Android Downloads UI, e.g. 90.83 MB). */
export function formatDecimalMb(bytes: number): string {
  return (bytes / 1_000_000).toFixed(2);
}

export function formatProgressLabel(
  loaded: number,
  total: number | null,
  percent: number | null,
): string {
  if (total !== null && percent !== null) {
    return `Downloading… ${percent}% (${formatDecimalMb(loaded)} MB / ${formatDecimalMb(total)} MB)`;
  }
  if (total !== null) {
    return `Downloading… (${formatDecimalMb(loaded)} MB / ${formatDecimalMb(total)} MB)`;
  }
  return "Downloading…";
}
