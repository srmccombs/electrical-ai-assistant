'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TableInfo {
  category: string
  table_name: string
  size: string
  suggested_new_name: string
}

export default function DatabaseOrganization() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTableOrganization()
  }, [])

  const fetchTableOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('table_organization')
        .select('*')
        .order('category', { ascending: true })
        .order('table_name', { ascending: true })

      if (error) throw error
      setTables(data || [])
    } catch (error) {
      console.error('Error fetching table organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(tables.map(t => t.category))]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Organization</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold mb-3 text-blue-600">
              {category}
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Suggested Name
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables
                    .filter(t => t.category === category)
                    .map(table => (
                      <tr key={table.table_name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {table.table_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {table.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {table.suggested_new_name}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Quick Links</h3>
        <div className="space-y-1">
          <div>
            <a href="/admin/decision-engine" className="text-blue-600 hover:underline">
              Decision Engine Monitor
            </a>
          </div>
          <div>
            <a href="/analytics" className="text-blue-600 hover:underline">
              Analytics Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}