// search/shared/searchUtils.ts
// Utility functions for search operations

/**
 * Sanitizes a search term for PostgreSQL full-text search (tsquery)
 * Removes or escapes characters that can cause syntax errors
 */
export function sanitizeForTsquery(searchTerm: string): string {
  // Trim whitespace
  let sanitized = searchTerm.trim();
  
  // Remove common words that might cause issues in tsquery
  const problemWords = ['need', 'want', 'get', 'find', 'looking', 'for'];
  const words = sanitized.toLowerCase().split(/\s+/);
  
  // Filter out problem words and numbers at the beginning
  const filteredWords = words.filter(word => {
    // Keep the word if it's not a problem word and not just a number
    return !problemWords.includes(word) && !/^\d+$/.test(word);
  });
  
  // If we filtered out everything, use the original term without numbers
  if (filteredWords.length === 0) {
    sanitized = sanitized.replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim();
  } else {
    sanitized = filteredWords.join(' ');
  }
  
  // If still empty, return a safe default
  return sanitized || 'product';
}

/**
 * Extracts the numeric quantity from a search term
 */
export function extractQuantity(searchTerm: string): number | undefined {
  const match = searchTerm.match(/\b(\d+)\s*(port|ports|gang|gangs)?\b/i);
  return match ? parseInt(match[1]) : undefined;
}