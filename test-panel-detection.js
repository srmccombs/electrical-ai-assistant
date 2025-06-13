const detectPanelCapacity = (searchTerm) => {
  const term = searchTerm.toLowerCase()

  // First, find all numbers in the search term
  const numbers = term.match(/\d+/g)
  if (\!numbers) return undefined

  // Look for panel-related keywords
  const panelKeywords = ['panel', 'adapter', 'capacity', 'holds', 'slot', 'fap', 'cassette']
  
  // For each number, check if it's followed by a panel keyword
  for (const num of numbers) {
    const numValue = parseInt(num, 10)
    
    // Create a regex to find this specific number followed by panel keywords
    const numPattern = new RegExp(`\\b${num}\\s*(${panelKeywords.join('|')})`, 'i')
    
    if (numPattern.test(term)) {
      if (numValue >= 1 && numValue <= 24) { // Reasonable panel range for wall mount
        console.log(`Detected panel capacity request: ${numValue} panels`)
        return numValue
      }
    }
  }

  return undefined
}

// Test cases
const testQueries = [
  "i need a wall mount fiber enclosure 4 panel",
  "i need 4 wall mount fiber enclosure 6 panel",
  "wall mount enclosure 8 panel capacity",
  "2 panel fiber enclosure"
]

testQueries.forEach(query => {
  console.log(`\nTesting: "${query}"`)
  const result = detectPanelCapacity(query)
  console.log(`Result: ${result}`)
})
