// We've observed that Firefox's DOM APIs and Canvas APIs do not return
// identical values given the same rendered text, in particular when the DOM
// element is inside a flexbox. They're floating point numbers off by ~0.5.
const FIREFOX_WIDTH_VARIANCE = 0.5;

/**
 * Binary search to find the maximum middle-truncated text that will fit within the specified target width.
 * The truncation will occur in the center of the string, with the same number of characters on either side.
 */
export const calculateMiddleTruncation = (
  text: string,
  targetWidth: number,
  measure: (value: string) => number,
): string => {
  // Skip the search if the text will already fit as-is (or is very, very close).
  const fullWidth = measure(text);
  if (fullWidth < targetWidth || Math.abs(fullWidth - targetWidth) < FIREFOX_WIDTH_VARIANCE) {
    return text;
  }

  // The binary search uses half the string length to find the maximum character count between 1 and `half`
  // that will fit within the target width.
  let start = 1;
  let end = Math.floor(text.length / 2);

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const measuredWidth = measure(`${text.slice(0, mid)}…${text.slice(-mid)}`);
    if (measuredWidth < targetWidth) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  return `${text.slice(0, end)}…${text.slice(-end)}`;
};
