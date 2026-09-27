import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react'
import { createAnnouncement, setFloodProneBarangay, subscribeToFloodProneBarangays } from '../../../services/firebase.js'
import { BARANGAYS } from '../../data/barangays.js'
import '../css/flood-prone.css'

function FloodPronePage() {
  const [floodProneBarangays, setFloodProneBarangays] = useState([])
  const [selectedBarangay, setSelectedBarangay] = useState(BARANGAYS[0] || '')
  const [threatBarangay, setThreatBarangay] = useState('')
  const [threatMessage, setThreatMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => subscribeToFloodProneBarangays((barangays) => {
    setFloodProneBarangays(barangays)
    setIsLoading(false)
    setError('')
  }, (subscriptionError) => {
    setError(subscriptionError.message || 'Unable to load flood-prone barangays.')
    setIsLoading(false)
  }), [])

  const floodProneNames = useMemo(() => new Set(floodProneBarangays.map((item) => item.barangay)), [floodProneBarangays])
  const availableBarangays = BARANGAYS.filter((barangay) => !floodProneNames.has(barangay))

  const handleAddBarangay = async (event) => {
    event.preventDefault()
    if (!selectedBarangay) return
    setIsSaving(true)
    setError('')
    setStatus('')
    try {
      await setFloodProneBarangay(selectedBarangay, true)
      setStatus(`${selectedBarangay} added to the flood-prone list.`)
      setSelectedBarangay(availableBarangays.find((barangay) => barangay !== selectedBarangay) || '')
    } catch (saveError) {
      setError(saveError.message || 'Unable to add this barangay.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveBarangay = async (barangay) => {
    setIsSaving(true)
    setError('')
    setStatus('')
    try {
      await setFloodProneBarangay(barangay, false)
      setStatus(`${barangay} removed from the flood-prone list.`)
    } catch (saveError) {
      setError(saveError.message || 'Unable to remove this barangay.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendThreat = async (event) => {
    event.preventDefault()
    if (!threatBarangay || !threatMessage.trim()) return
    setIsSaving(true)
    setError('')
    setStatus('')
    try {
      await createAnnouncement({
        channel: 'web',
        type: 'Warning',
        audience: 'barangay',
        priority: 'high',
        title: `Flood Threat - ${threatBarangay}`,
        message: threatMessage.trim(),
        barangay: threatBarangay,
      })
      setStatus(`Flood threat published to ${threatBarangay}.`)
      setThreatBarangay('')
      setThreatMessage('')
    } catch (sendError) {
      setError(sendError.message || 'Unable to publish the flood threat.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="flood-prone-page">
      <header className="flood-prone-page__header">
        <div>
          <p className="flood-prone-page__eyebrow">Risk areas</p>
          <h1>Usually Flooded Barangays</h1>
        </div>
      </header>

      <form className="flood-prone-add" onSubmit={handleAddBarangay}>
        <label htmlFor="flood-prone-select">Barangay</label>
        <select id="flood-prone-select" value={selectedBarangay} onChange={(event) => setSelectedBarangay(event.target.value)} disabled={!availableBarangays.length || isSaving}>
          {!availableBarangays.length && <option value="">All barangays are listed</option>}
          {availableBarangays.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
        </select>
        <button type="submit" disabled={!selectedBarangay || isSaving || !availableBarangays.length}>
          <Plus aria-hidden="true" size={18} />
          Mark Flood-Prone
        </button>
      </form>

      {(error || status) && <p className={`flood-prone-feedback${error ? ' is-error' : ''}`} role={error ? 'alert' : 'status'}>{error || status}</p>}

      <section className="flood-prone-list" aria-label="Flood-prone barangays">
        <div className="flood-prone-list__heading">
          <h2>Flood-Prone Barangays</h2>
          <span>{floodProneBarangays.length}</span>
        </div>
        {isLoading ? (
          <p className="flood-prone-list__empty">Loading barangays...</p>
        ) : floodProneBarangays.length ? (
          <ul>
            {floodProneBarangays.map(({ id, barangay }) => (
              <li key={id}>
                <span>{barangay}</span>
                <div className="flood-prone-list__actions">
                  <button className="flood-prone-threat" type="button" onClick={() => { setThreatBarangay(barangay); setThreatMessage('') }} disabled={isSaving}>
                    <AlertTriangle aria-hidden="true" size={17} />
                    Flood Threat
                  </button>
                  <button className="flood-prone-remove" type="button" onClick={() => handleRemoveBarangay(barangay)} aria-label={`Remove ${barangay} from flood-prone list`} disabled={isSaving}>
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flood-prone-list__empty">No barangays are marked yet.</p>
        )}
      </section>

      {threatBarangay && (
        <div className="flood-threat-overlay" onClick={() => setThreatBarangay('')}>
          <form className="flood-threat-dialog" role="dialog" aria-modal="true" aria-labelledby="flood-threat-title" onSubmit={handleSendThreat} onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p>Target barangay</p>
                <h2 id="flood-threat-title">Flood Threat: {threatBarangay}</h2>
              </div>
              <button type="button" aria-label="Close flood threat dialog" onClick={() => setThreatBarangay('')} disabled={isSaving}>
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            <label htmlFor="flood-threat-message">Threat details</label>
            <textarea id="flood-threat-message" value={threatMessage} onChange={(event) => setThreatMessage(event.target.value)} maxLength={2000} rows={5} required placeholder="Describe the flood threat and what residents should do." />
            <footer>
              <button className="flood-threat-cancel" type="button" onClick={() => setThreatBarangay('')} disabled={isSaving}>Cancel</button>
              <button className="flood-threat-send" type="submit" disabled={isSaving || !threatMessage.trim()}>
                {isSaving ? 'Publishing...' : 'Send Flood Threat'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  )
}

export default FloodPronePage