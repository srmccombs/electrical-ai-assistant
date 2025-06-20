'use client'

// Test page to compare V1 vs V2 search performance
// Created: June 19, 2025

import React, { useState } from 'react'
import { compareSearchPerformance } from '@/search/categoryCables'

export default function TestSearchPerformance() {
  const [results, setResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [useV2, setUseV2] = useState(process.env.NEXT_PUBLIC_USE_V2_SEARCH === 'true')

  const testSearches = [
    'cat6 cable',
    'cat5e plenum',
    'shielded ethernet cable',
    'panduit',
    'blue network cable',
    'Category 6A UTP'
  ]

  const runTests = async () => {
    setTesting(true)
    setResults([])
    
    const newResults = []
    
    for (const searchTerm of testSearches) {
      try {
        const result = await compareSearchPerformance(searchTerm)
        newResults.push({ searchTerm, ...result })
        setResults([...newResults])
      } catch (error) {
        console.error('Test error:', error)
        newResults.push({ 
          searchTerm, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    setTesting(false)
  }

  const toggleV2 = () => {
    const newValue = !useV2
    setUseV2(newValue)
    // Note: This would need to update the environment variable
    // For now, just show the current state
    alert(`V2 Search is currently: ${process.env.NEXT_PUBLIC_USE_V2_SEARCH === 'true' ? 'ENABLED' : 'DISABLED'}\\n\\nTo change it, update NEXT_PUBLIC_USE_V2_SEARCH in your .env.local file`)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Search Performance Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Configuration</h2>
        <p className="mb-2">
          V2 Search Status: 
          <span className={`ml-2 px-3 py-1 rounded ${useV2 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {useV2 ? 'ENABLED' : 'DISABLED'}
          </span>
        </p>
        <button
          onClick={toggleV2}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Toggle V2 Search
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Searches</h2>
        <ul className="list-disc list-inside mb-4">
          {testSearches.map((term, idx) => (
            <li key={idx} className="text-gray-700">{term}</li>
          ))}
        </ul>
        <button
          onClick={runTests}
          disabled={testing}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {testing ? 'Running Tests...' : 'Run Performance Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Results</h2>
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-lg mb-2">&quot;{result.searchTerm}&quot;</h3>
                
                {result.error ? (
                  <p className="text-red-500">Error: {result.error}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">V1 (Old Logic)</p>
                      <p className="text-2xl font-bold text-red-600">{result.v1Time}ms</p>
                      <p className="text-sm">{result.v1Count} products</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">V2 (Database)</p>
                      <p className="text-2xl font-bold text-green-600">{result.v2Time}ms</p>
                      <p className="text-sm">{result.v2Count} products</p>
                    </div>
                    <div className="col-span-2 mt-2 pt-2 border-t">
                      <p className="text-center">
                        <span className="text-2xl font-bold text-blue-600">{result.speedup}x faster</span>
                        <span className="text-gray-600 ml-2">({result.v1Time - result.v2Time}ms saved)</span>
                      </p>
                      {!result.resultsMatch && (
                        <p className="text-yellow-600 text-center mt-1">
                          ⚠️ Result counts don&apos;t match - needs investigation
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Summary */}
          {results.length > 0 && !results.some(r => r.error) && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Summary</h3>
              <p>Average V1 time: {Math.round(results.reduce((sum, r) => sum + r.v1Time, 0) / results.length)}ms</p>
              <p>Average V2 time: {Math.round(results.reduce((sum, r) => sum + r.v2Time, 0) / results.length)}ms</p>
              <p className="font-bold text-green-600 mt-2">
                Average speedup: {Math.round(results.reduce((sum, r) => sum + r.speedup, 0) / results.length)}x faster!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}