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
  const problemWords = ['i', 'need', 'want', 'get', 'find', 'looking', 'for', 'the', 'a', 'an'];
  const words = sanitized.toLowerCase().split(/\s+/);
  
  // Filter out problem words but keep meaningful content
  const filteredWords = words.filter(word => {
    // Keep the word if:
    // 1. It's not a problem word
    // 2. It's not a single character (unless it's a letter-number combo like "6a")
    // 3. It has some alphanumeric content
    return !problemWords.includes(word) && 
           (word.length > 1 || /[a-z]\d|\d[a-z]/i.test(word)) &&
           /[a-zA-Z0-9]/.test(word);
  });
  
  // If we filtered out everything, try to extract meaningful terms
  if (filteredWords.length === 0) {
    // Look for product-related terms in the original
    const productTerms = sanitized.match(/\b(faceplate|plate|port|gang|keystone|wall|mount|box|jack|module|cat\d+[a-z]?|fiber|cable|connector|panel|enclosure)\b/gi);
    if (productTerms && productTerms.length > 0) {
      sanitized = productTerms.join(' ');
    } else {
      // Last resort - try to keep any word with 2+ characters
      const anyWords = sanitized.split(/\s+/).filter(w => w.length >= 2 && /[a-zA-Z]/.test(w));
      sanitized = anyWords.length > 0 ? anyWords.join(' ') : 'faceplate';
    }
  } else {
    // Join filtered words, but ensure we don't start with just a number
    sanitized = filteredWords.join(' ');
    // If it starts with just a number, add a default term
    if (/^\d+\s*$/.test(sanitized)) {
      sanitized = 'faceplate';
    }
  }
  
  // Clean up any special characters that might cause tsquery issues
  sanitized = sanitized
    .replace(/[^\w\s-]/g, ' ')  // Replace non-word chars (except hyphens) with space
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim();
  
  // If still empty or too short, return a safe default
  return sanitized.length > 0 ? sanitized : 'faceplate';
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