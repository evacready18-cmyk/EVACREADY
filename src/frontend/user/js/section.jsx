import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PhoneCall } from 'lucide-react'
import { dismissCurrentUserAnnouncement, markCurrentUserNotificationsRead, subscribeToAnnouncements, subscribeToDismissedAnnouncements, subscribeToResidentEvacueeHistory, subscribeToUserProfile, updateCurrentUserProfile } from '../../../services/firebase'
import { BARANGAYS } from '../../data/barangays'
import '../css/section.css'

const EMERGENCY_HOTLINES = [
  { name: 'LDRRMO', number: '0951 682 150', tel: '+63951682150' },
  { name: 'MHO Isabela', number: '0963 156 6032', tel: '+639631566032' },
  { name: 'BFP', number: '0970 465 9383', tel: '+639704659383' },
  { name: 'PNP Isabela', number: '0999 415 476', tel: '+63999415476' },
  { name: 'NOCECO', number: '0998 570 2725', tel: '+639985702725' },
]

const sectionTitles = {
  'user-information': 'My Profile',
  'user-request': 'Request',
  'user-announcement': 'Alert Notification',
  'user-history': 'Check-in History',
  'user-emergency-call': 'Emergency Call',
}

function formatHistoryDate(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toLocaleString() : 'Pending...'
}

function historyDateKey(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().toISOString().slice(0, 10) : ''
}

function UserSection({ page, currentUid }) {
  const title = sectionTitles[page] || 'My Profile'
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', barangay: '' })
  const [isLoading, setIsLoading] = useState(page === 'user-information')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState([])
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState([])
  const [history, setHistory] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All')
  const [historyDateFilter, setHistoryDateFilter] = useState('')

  useEffect(() => {
    if (!currentUid) return undefined

    setIsLoading(true)
    const unsubscribe = subscribeToUserProfile(currentUid, (nextProfile) => {
      setProfile(nextProfile)
      setForm({
        name: nextProfile?.name || '',
        phone: nextProfile?.phone || '',
        barangay: nextProfile?.barangay || '',
      })
      setIsLoading(false)
    })
    return unsubscribe
  }, [page, currentUid])

  useEffect(() => {
    if (!currentUid) return undefined
    return subscribeToDismissedAnnouncements(setDismissedAnnouncementIds)
  }, [currentUid])

  const handleDismissAnnouncement = async (announcementId) => {
    try {
      await dismissCurrentUserAnnouncement(announcementId)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  useEffect(() => {
    if (page !== 'user-announcement' || !currentUid) return undefined
    markCurrentUserNotificationsRead().catch((error) => console.error('Error marking notifications as read:', error))
    return subscribeToAnnouncements(setAnnouncements, ['all', 'evacuees'])
  }, [page, currentUid])

  useEffect(() => {
    if (page !== 'user-history' || !currentUid) return undefined
    return subscribeToResidentEvacueeHistory(currentUid, setHistory)
  }, [page, currentUid])

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase()
    return history.filter((record) => {
      const matchesSearch = !query || (record.centerName || '').toLowerCase().includes(query)
      const matchesStatus = historyStatusFilter === 'All' || record.status === historyStatusFilter
      const matchesDate = !historyDateFilter ||
        historyDateKey(record.checkedInAt) === historyDateFilter ||
        historyDateKey(record.checkedOutAt) === historyDateFilter
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [history, historySearch, historyStatusFilter, historyDateFilter])

  const activeHistoryCount = history.filter((record) => record.status === 'Active').length
  const checkedOutHistoryCount = history.filter((record) => record.status === 'Checked out').length

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.barangay) {
      setMessage('Complete your name, phone number, and barangay before saving.')
      return
    }

    setIsSaving(true)
    setMessage('')
    try {
      await updateCurrentUserProfile(form)
      setMessage('Profile updated.')
    } catch (error) {
      setMessage(error.message || 'Unable to update your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <section className="home-page">
      <header className="home-header">
        <div>
          <p className="home-subtitle">Resident workspace</p>
          <h1>{title}</h1>
        </div>
      </header>
      {page === 'user-information' && (
        <div className="resident-profile-layout">
          <section className="resident-profile-panel">
            <div className="resident-profile-panel__heading">
              <div>
                <p className="resident-profile-panel__eyebrow">Resident profile</p>
                <h2>Your details</h2>
              </div>
              <div className="resident-profile-panel__badges">
                <span className="resident-profile-panel__status">{profile?.status || 'Inactive'}</span>
                <span className={`resident-profile-panel__verification${profile?.verified ? ' verified' : ''}`}>
                  {profile?.verified ? 'Verified account' : 'Pending verification'}
                </span>
              </div>
            </div>
            {isLoading ? (
              <p className="resident-profile-loading">Loading profile...</p>
            ) : (
              <form className="resident-profile-form" onSubmit={handleSubmit}>
                <label>
                  Full name
                  <input name="name" value={form.name} onChange={handleChange} autoComplete="name" required />
                </label>
                <label>
                  Email address
                  <input value={profile?.email || ''} type="email" readOnly aria-readonly="true" />
                </label>
                <label>
                  Phone number
                  <input name="phone" value={form.phone} onChange={handleChange} type="tel" autoComplete="tel" required />
                </label>
                <label>
                  Barangay
                  <select name="barangay" value={form.barangay} onChange={handleChange} required>
                    <option value="">Select barangay</option>
                    {BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
                  </select>
                </label>
                {message && <p className={`resident-profile-message${message === 'Profile updated.' ? ' success' : ''}`} role="status">{message}</p>}
                <button type="submit" className="resident-profile-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            )}
          </section>
          <section className="resident-profile-qr">
            <div className="resident-id-card">
              <div className="resident-id-card__header">
                <div>
                  <p>EvacReady</p>
                  <h2>Resident ID</h2>
                </div>
                <span className={`resident-id-card__verification${profile?.verified ? ' verified' : ''}`}>
                  {profile?.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <p className="resident-id-card__name">{profile?.name || 'Resident'}</p>
              <div className="resident-id-card__body">
                <div className="resident-id-card__top">
                  <div className="resident-id-card__photo">
                    {profile?.idPhotoUrl ? (
                      <img src={profile.idPhotoUrl} alt="Resident ID" />
                    ) : (
                      <span className="resident-id-card__photo-placeholder">No ID photo</span>
                    )}
                  </div>
                  <div className="resident-id-card__details">
                    <p>{profile?.barangay || 'Barangay not recorded'}</p>
                    <p>{profile?.phone || 'Phone not recorded'}</p>
                  </div>
                </div>
                <div className="resident-id-card__code">
                  {currentUid && <QRCodeSVG value={currentUid} size={118} level="M" includeMargin />}
                  <span>Scan for check-in</span>
                </div>
              </div>
              <p className="resident-id-card__footer">Emergency resident identification</p>
            </div>
            <button type="button" className="resident-profile-print" onClick={handlePrint}>
              Print resident ID
            </button>
          </section>
        </div>
      )}
      {page !== 'user-information' && (
        page === 'user-announcement' ? (
          <section className="resident-announcements">
            {announcements.filter((announcement) => !dismissedAnnouncementIds.includes(announcement.id)).length === 0 ? (
              <p className="resident-announcements__empty">No alert notifications have been published yet.</p>
            ) : announcements.filter((announcement) => !dismissedAnnouncementIds.includes(announcement.id)).map((announcement) => (
              <article className={`resident-announcement resident-announcement--${announcement.priority || 'medium'}`} key={announcement.id}>
                <div className="resident-announcement__heading">
                  <div>
                    <p>{announcement.type || 'Information'} · {announcement.audience === 'evacuees' ? 'Evacuees' : 'All residents'}</p>
                    <h2>{announcement.title}</h2>
                  </div>
                  <div className="resident-announcement__actions">
                    <time>{announcement.createdAt?.toDate ? announcement.createdAt.toDate().toLocaleDateString() : 'Sending...'}</time>
                    <button type="button" onClick={() => handleDismissAnnouncement(announcement.id)}>Delete</button>
                  </div>
                </div>
                <p className="resident-announcement__message">{announcement.message}</p>
              </article>
            ))}
          </section>
        ) : page === 'user-history' ? (
          <section className="resident-history">
            <div className="resident-history__metrics">
              <article className="resident-history__metric">
                <p>Total visits</p>
                <span>{history.length}</span>
              </article>
              <article className="resident-history__metric">
                <p>Currently active</p>
                <span>{activeHistoryCount}</span>
              </article>
              <article className="resident-history__metric">
                <p>Checked out</p>
                <span>{checkedOutHistoryCount}</span>
              </article>
            </div>
            <div className="resident-history__controls">
              <input
                type="search"
                placeholder="Search evacuation center"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
              />
              <input
                type="date"
                value={historyDateFilter}
                onChange={(event) => setHistoryDateFilter(event.target.value)}
                aria-label="Filter by check-in or check-out date"
              />
              <select value={historyStatusFilter} onChange={(event) => setHistoryStatusFilter(event.target.value)}>
                <option value="All">All transactions</option>
                <option value="Active">Active check-ins</option>
                <option value="Checked out">Checked out</option>
              </select>
            </div>
            <div className="resident-history__table-wrap">
              <table className="resident-history__table">
                <thead>
                  <tr>
                    <th>EVACUATION CENTER</th>
                    <th>CHECK-IN TIME</th>
                    <th>CHECK-OUT TIME</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{record.centerName || 'Evacuation Center'}</td>
                      <td>{formatHistoryDate(record.checkedInAt)}</td>
                      <td>{record.checkedOutAt ? formatHistoryDate(record.checkedOutAt) : 'Still checked in'}</td>
                      <td>
                        <span className={`resident-history__status resident-history__status--${(record.status || 'active').toLowerCase().replace(/\s+/g, '-')}`}>
                          {record.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!filteredHistory.length && (
                    <tr><td colSpan="4">No check-in or check-out records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : page === 'user-emergency-call' ? (
          <section className="resident-emergency">
            <p className="resident-emergency__hint">Tap a hotline to call for help immediately.</p>
            <div className="resident-emergency__list">
              {EMERGENCY_HOTLINES.map((hotline) => (
                <a className="resident-emergency__item" key={hotline.tel} href={`tel:${hotline.tel}`}>
                  <span className="resident-emergency__icon"><PhoneCall aria-hidden="true" size={22} strokeWidth={2.5} /></span>
                  <span className="resident-emergency__details">
                    <strong>{hotline.name}</strong>
                    <span>{hotline.number}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : (
          <section className="panel" style={{ maxWidth: '720px', maxHeight: 'none' }}>
            <h2>{title}</h2>
            <p>This resident section is ready for its workflow and data.</p>
          </section>
        )
      )}
    </section>
  )
}

export default UserSection
