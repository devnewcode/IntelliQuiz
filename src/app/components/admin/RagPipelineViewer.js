'use client'

// Displays the current status of each RAG pipeline step.

const ICONS = { pending: '○', active: '⏳', done: '✓' }

export default function RagPipelineViewer({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <div style={{
      background: '#f8f9fa',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '16px 20px',
      margin: '12px 0',
      fontFamily: 'monospace',
      fontSize: '14px'
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 0',
          color: step.status === 'pending' ? '#94a3b8' : '#1e293b',
          fontWeight: step.status === 'active' ? 600 : 400
        }}>
          <span>{ICONS[step.status]}</span>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  )
}