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

/**
 * Converts pair count to fiber count and detects pair terminology
 * Handles common misspellings like "pr", "pare", "piar", "par", "prs"
 * @param searchTerm The search term to analyze
 * @returns Object with original pair count, converted fiber count, and whether pairs were detected
 */
export function detectAndConvertPairToFiber(searchTerm: string): {
  detectedPairs: boolean;
  pairCount?: number;
  fiberCount?: number;
  normalizedTerm: string;
} {
  const lowerTerm = searchTerm.toLowerCase();
  
  // Regex pattern to match pair terminology with common misspellings
  // Matches: pair, pairs, pr, prs, pare, pares, piar, piars, par, pars
  // With or without spaces/hyphens between number and term
  const pairPattern = /\b(\d+)\s*[-]?\s*(pair|pairs|pr|prs|pare|pares|piar|piars|par|pars)\b/i;
  
  const match = lowerTerm.match(pairPattern);
  
  if (match) {
    const pairCount = parseInt(match[1], 10);
    const fiberCount = pairCount * 2;
    
    // Replace the pair terminology with fiber count for normalized search
    const normalizedTerm = searchTerm.replace(pairPattern, `${fiberCount} fiber`);
    
    console.log(`🔄 Pair-to-fiber conversion: ${pairCount} pair(s) = ${fiberCount} fibers`);
    
    return {
      detectedPairs: true,
      pairCount,
      fiberCount,
      normalizedTerm
    };
  }
  
  // Check if the term contains pair terminology without a number
  const pairTermsOnly = /\b(pair|pairs|pr|prs|pare|pares|piar|piars|par|pars)\b/i;
  if (pairTermsOnly.test(lowerTerm)) {
    console.log(`🔍 Pair terminology detected but no count specified`);
    return {
      detectedPairs: true,
      normalizedTerm: searchTerm
    };
  }
  
  return {
    detectedPairs: false,
    normalizedTerm: searchTerm
  };
}