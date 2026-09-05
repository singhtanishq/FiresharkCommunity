import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { reportsApi } from '../../api/endpoints'
import { reportReasonLabels } from '../../lib/format'
import { apiError } from '../../api/client'

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

  return (
    <Modal
      title={done ? 'Report submitted' : 'Report content'}
      onClose={onClose}
      footer={done
        ? <button className="btn btn--primary" onClick={onClose}>Close</button>
        : (
          <>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={submit} disabled={busy}>
              {busy ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        )}
    >
      {done
        ? <p style={{ marginTop: 0 }}>Thank you — a moderator will review this content soon.</p>
        : (
          <>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label htmlFor="report-reason">Reason</label>
              <select id="report-reason" className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {Object.entries(reportReasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="report-description">Details (optional)</label>
              <textarea
                id="report-description"
                className="textarea"
                style={{ minHeight: 90 }}
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Anything that helps moderators understand the problem."
              />
            </div>
            <p className="muted">Reports are reviewed by moderators. Please do not report disagreements about technical opinions.</p>
          </>
        )}
    </Modal>
  )
}
