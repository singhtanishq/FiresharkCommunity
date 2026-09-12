import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { reportsApi } from '../../api/endpoints'
import { reportReasonLabels } from '../../lib/format'
import { apiError } from '../../api/client'
import { 
  Flag, AlertTriangle, CheckCircle2, ShieldAlert 
} from 'lucide-react'

export function ReportModal({ reportableType, reportableId, onClose }: {
  reportableType: 'question' | 'answer' | 'comment'
  reportableId: number
  onClose: () => void
}) {
  const [reason, setReason] = useState('spam')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await reportsApi.create({ reportable_type: reportableType, reportable_id: reportableId, reason, description: description || undefined })
      setDone(true)
    } catch (e) {
      setError(apiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  const typeLabel = reportableType === 'question' ? 'Question' : reportableType === 'answer' ? 'Answer' : 'Comment'

  return (
    <Modal
      title={
        <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <Flag size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
          <span>{done ? 'Report Transmitted' : `Report ${typeLabel}`}</span>
        </div>
      }
      onClose={onClose}
      footer={
        done ? (
          <button className="btn btn--primary btn--block" onClick={onClose}>
            Close Dialog
          </button>
        ) : (
          <div className="row" style={{ width: '100%', display: 'flex', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className="btn btn--quiet" onClick={onClose} disabled={busy} style={{ flex: '1 1 auto' }}>
              Cancel
            </button>
            <button className="btn btn--danger" onClick={submit} disabled={busy} style={{ flex: '1 1 auto' }}>
              {busy ? 'Transmitting…' : 'Submit Report'}
            </button>
          </div>
        )
      }
    >
      <div style={{ animation: 'fade-in var(--dur-fast) var(--ease)', width: '100%', overflowX: 'hidden' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 1rem' }}>
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--ink-900)' }}>Report Received</h3>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>
              Thank you for helping keep the network secure. A human moderator will review this {reportableType} shortly.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="banner banner--danger mb-3" style={{ borderRadius: 'var(--radius)' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} /> <span>{error}</span>
              </div>
            )}
            
            <div className="banner banner--info mb-3" style={{ borderRadius: 'var(--radius)', alignItems: 'flex-start' }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.88rem', wordBreak: 'break-word' }}>
                You are reporting {reportableType} #{reportableId}. Reports are confidential and reviewed strictly by staff.
              </span>
            </div>

            <div className="field">
              <label htmlFor="report-reason">Violation Category</label>
              <select 
                id="report-reason" 
                className="select input--lg" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                style={{ cursor: 'pointer', fontWeight: 500 }}
              >
                {Object.entries(reportReasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: '1rem' }}>
              <label htmlFor="report-description">Additional Context (Optional)</label>
              <textarea
                id="report-description"
                className="textarea"
                style={{ minHeight: 110, fontSize: '0.95rem' }}
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specific details or references that help moderators understand the breach..."
              />
              <span className="hint">Maximum 2,000 characters. Please do not report simple disagreements about technical opinions.</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}