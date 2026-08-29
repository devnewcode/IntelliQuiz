'use client'

// Displays the current status of each RAG pipeline step.

const ICONS = { pending: '○', active: '⏳', done: '✓' }

export default function RagPipelineViewer({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.35)',
      border: '1px solid rgba(139, 92, 246, 0.25)',
      borderRadius: '12px',
      padding: '16px 20px',
      margin: '14px 0',
      fontFamily: "'Fira Code', 'Fira Mono', monospace",
      fontSize: '13.5px'
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 0',
          color: step.status === 'pending' ? '#64748b' : step.status === 'active' ? '#c4b5fd' : '#6ee7b7',
          fontWeight: step.status === 'active' ? 700 : 500
        }}>
          <span>{ICONS[step.status]}</span>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  )
}