/**
 * Utility for managing context windows and token budgets.
 * Uses a standard heuristic: 1 token ≈ 4 characters.
 */

/**
 * Estimates the token count for a given string using the 1 token = 4 chars heuristic.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Splits text into an array of chunks where no chunk exceeds the maxTokens limit.
 * It attempts to break cleanly at word boundaries to preserve readability.
 * 
 * @param text The input text to chunk.
 * @param maxTokens The maximum number of tokens allowed per chunk.
 * @returns An array of string chunks. Returns an empty array if input is empty.
 */
export function chunkText(text: string, maxTokens: number): string[] {
  if (!text) return [];

  const tokens = estimateTokens(text);
  if (tokens <= maxTokens) {
    return [text];
  }

  const charsPerChunk = Math.max(1, maxTokens * 4);
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let chunkEnd = currentIndex + charsPerChunk;

    // If we reached the end of the string, push the remainder and break
    if (chunkEnd >= text.length) {
      chunks.push(text.slice(currentIndex).trim());
      break;
    }

    // Try to back up to the nearest space to avoid cutting a word in half
    const lastSpace = text.lastIndexOf(" ", chunkEnd);
    
    // Ensure the last space is actually within the current chunk boundary
    if (lastSpace > currentIndex) {
      chunkEnd = lastSpace;
    }

    chunks.push(text.slice(currentIndex, chunkEnd).trim());

    // Advance index, skipping the space we just broke at (if applicable)
    currentIndex = chunkEnd;
    if (text[currentIndex] === " ") {
      currentIndex++;
    }
  }

  // Filter out any empty chunks caused by multiple spaces
  return chunks.filter(chunk => chunk.length > 0);
}
