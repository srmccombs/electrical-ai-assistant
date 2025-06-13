const detectPanelCapacity = (searchTerm) => {
  const term = searchTerm.toLowerCase()
  const numbers = term.match(/\d+/g)
  if (\!numbers) return undefined

  const panelKeywords = ["panel", "adapter", "capacity", "holds", "slot", "fap", "cassette"]
  
  for (const num of numbers) {
    const numValue = parseInt(num, 10)
    const numPattern = new RegExp(`\\b${num}\\s*(${panelKeywords.join("|")})`, "i")
    
    if (numPattern.test(term)) {
      if (numValue >= 1 && numValue <= 24) {
        console.log(`Detected panel capacity request: ${numValue} panels`)
        return numValue
      }
    }
  }
  return undefined
}

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
