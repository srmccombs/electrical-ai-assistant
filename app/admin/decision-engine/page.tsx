// app/admin/decision-engine/page.tsx
// Decision Engine Monitoring Dashboard

'use client'

import React, { useState, useEffect } from 'react'

interface EngineStatus {
  currentMode: string
  ready: boolean
  report: string
  timestamp: string
}

interface ShadowReport {
  report: string
  hours: number
  generated: string
}

export default function DecisionEngineMonitor() {
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null)
  const [shadowReport, setShadowReport] = useState<ShadowReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch engine status on load
  useEffect(() => {
    fetchEngineStatus()
  }, [])

  const fetchEngineStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/engine-readiness')
      const data = await response.json()
      
      if (data.success) {
        setEngineStatus(data)
      } else {
        setError(data.error || 'Failed to fetch engine status')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchShadowReport = async (hours: number = 24) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/shadow-report?hours=${hours}`)
      const data = await response.json()
      
      if (data.success) {
        setShadowReport(data)
      } else {
        setError(data.error || 'Failed to fetch shadow report')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'production':
        return '#10b981' // green
      case 'shadow':
        return '#f59e0b' // yellow
      case 'disabled':
        return '#6b7280' // gray
      default:
        return '#6b7280'
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '32px' }}>
        Decision Engine Monitor
      </h1>

      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {/* Current Status Card */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Current Status</h2>
        </div>
        <div style={{ padding: '24px' }}>
          {loading && !engineStatus ? (
            <div>Loading...</div>
          ) : engineStatus ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontWeight: '500', marginRight: '16px' }}>Mode:</span>
                <span style={{
                  backgroundColor: getModeColor(engineStatus.currentMode),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {engineStatus.currentMode.toUpperCase()}
                </span>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontWeight: '500', marginRight: '16px' }}>Production Ready:</span>
                <span style={{
                  backgroundColor: engineStatus.ready ? '#10b981' : '#ef4444',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {engineStatus.ready ? 'YES' : 'NO'}
                </span>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontWeight: '500', marginRight: '16px' }}>Last Check:</span>
                <span style={{ color: '#6b7280' }}>
                  {new Date(engineStatus.timestamp).toLocaleString()}
                </span>
              </div>

              <div>
                <h3 style={{ fontWeight: '500', marginBottom: '8px' }}>Readiness Report:</h3>
                <pre style={{
                  backgroundColor: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {engineStatus.report}
                </pre>
              </div>
            </div>
          ) : (
            <p style={{ color: '#6b7280' }}>No data available</p>
          )}
        </div>
      </div>

      {/* Shadow Mode Report Card */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Shadow Mode Report</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => fetchShadowReport(24)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Last 24 Hours
            </button>
            <button 
              onClick={() => fetchShadowReport(168)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Last 7 Days
            </button>
            <button 
              onClick={() => fetchShadowReport(720)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Last 30 Days
            </button>
          </div>

          {shadowReport && (
            <div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                Generated: {new Date(shadowReport.generated).toLocaleString()} 
                ({shadowReport.hours} hour window)
              </div>
              <pre style={{
                backgroundColor: '#f3f4f6',
                padding: '16px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {shadowReport.report}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Actions Card */}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e5e7eb', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Actions</h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button 
              onClick={fetchEngineStatus}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </button>
            
            <button 
              onClick={() => window.location.href = '/api/admin/shadow-report'}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              Download Raw Report
            </button>

            {engineStatus?.currentMode === 'shadow' && engineStatus.ready && (
              <button 
                onClick={() => alert('Please update USE_DECISION_ENGINE=production in your environment variables')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Switch to Production
              </button>
            )}
          </div>

          <div style={{ 
            backgroundColor: '#dbeafe', 
            padding: '16px', 
            borderRadius: '4px' 
          }}>
            <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>
              Environment Variable Status:
            </h4>
            <code style={{
              backgroundColor: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              USE_DECISION_ENGINE={engineStatus?.currentMode || 'not set'}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}