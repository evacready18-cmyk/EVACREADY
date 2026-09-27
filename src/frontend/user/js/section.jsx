import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PhoneCall } from 'lucide-react'
import { changeCurrentUserPassword, markCurrentUserNotificationsRead, subscribeToAnnouncements, subscribeToResidentEvacueeHistory, subscribeToUserProfile } from '../../../services/firebase'
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
  'user-id': 'My ID',
  'user-request': 'Request',
  'user-announcement': 'Alert Notification',
  'user-history': 'Check-in History',
  'user-emergency-call': 'Emergency Hotline',
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
  const [form, setForm] = useState({ name: '', phone: '', address: '', barangay: '' })
  const [isLoading, setIsLoading] = useState(page === 'user-information')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState([])
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
        address: nextProfile?.address || '',
        barangay: nextProfile?.barangay || '',
      })
      setIsLoading(false)
    })
    return unsubscribe
  }, [page, currentUid])

  useEffect(() => {
    if (page !== 'user-announcement' || !currentUid) return undefined
    markCurrentUserNotificationsRead().catch((error) => console.error('Error marking notifications as read:', error))
    return subscribeToAnnouncements(setAnnouncements, ['all', 'evacuees', 'barangay'], profile?.barangay)
  }, [page, currentUid, profile?.barangay])

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

  const handleChangePassword = async (event) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setIsChangingPassword(true)
    setMessage('')
    try {
      await changeCurrentUserPassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password updated.')
    } catch (error) {
      setMessage(error.code === 'auth/requires-recent-login'
        ? 'Please sign out and sign in again before changing your password.'
        : error.message || 'Unable to update your password.')
    } finally {
      setIsChangingPassword(false)
    }
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
              <>
                {profile && (
                  <p className={`resident-profile-verification-notice${profile.verified ? ' verified' : ''}`} role="status">
                    {profile.verified
                      ? 'Your account has been verified. You can now access the full system.'
                      : 'Your account is still being verified. Please wait for verification before using the full system.'}
                  </p>
                )}
                <div className="resident-profile-form">
                  <label>
                    Full name
                    <input name="name" value={form.name} readOnly aria-readonly="true" autoComplete="name" required />
                  </label>
                  <label>
                    Email address
                    <input value={profile?.email || ''} type="email" readOnly aria-readonly="true" />
                  </label>
                  <label>
                    Phone number
                    <input name="phone" value={form.phone} readOnly aria-readonly="true" type="tel" autoComplete="tel" required />
                  </label>
                  <label>
                    Address
                    <input name="address" value={form.address} readOnly aria-readonly="true" type="text" autoComplete="street-address" required />
                  </label>
                  <label>
                    Barangay
                    <select name="barangay" value={form.barangay} disabled required>
                      <option value="">Select barangay</option>
                      {BARANGAYS.map((barangay) => <option key={barangay} value={barangay}>{barangay}</option>)}
                    </select>
                  </label>
                </div>
                <form className="resident-profile-form resident-password-form" onSubmit={handleChangePassword}>
                  <h3>Change password</h3>
                  <label>
                    New password
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} required />
                  </label>
                  <label>
                    Confirm new password
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required />
                  </label>
                  {message && <p className={`resident-profile-message${message === 'Password updated.' ? ' success' : ''}`} role="status">{message}</p>}
                  <button type="submit" className="resident-profile-save" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </>
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
                    <p>{profile?.address || 'Address not recorded'}</p>
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
          </section>
        </div>
      )}
      {page === 'user-id' && (
        <div className="resident-id-section">
          <section className="resident-profile-panel">
            <div className="resident-profile-panel__heading">
              <div>
                <p className="resident-profile-panel__eyebrow">Identification</p>
                <h2>My uploaded ID</h2>
              </div>
              <span className={`resident-profile-panel__verification${profile?.verified ? ' verified' : ''}`}>
                {profile?.verified ? 'Verified account' : 'Pending verification'}
              </span>
            </div>
            <div className="resident-id-details">
              <div className="resident-id-details__photo">
                {profile?.idPhotoUrl ? (
                  <a href={profile.idPhotoUrl} target="_blank" rel="noopener noreferrer">
                    <img src={profile.idPhotoUrl} alt="Uploaded identification document" />
                  </a>
                ) : (
                  <span className="resident-id-card__photo-placeholder">No ID photo uploaded</span>
                )}
              </div>
              <div className="resident-id-details__info">
                <p><strong>ID type</strong>{profile?.idType || 'Not recorded'}</p>
                <p><strong>ID number</strong>{profile?.idNumber || 'Not recorded'}</p>
                <p><strong>Name</strong>{profile?.name || 'Not recorded'}</p>
                <p><strong>Address</strong>{profile?.address || 'Not recorded'}</p>
                <p><strong>Barangay</strong>{profile?.barangay || 'Not recorded'}</p>
                <p><strong>Phone number</strong>{profile?.phone || 'Not recorded'}</p>
              </div>
            </div>
          </section>
        </div>
      )}
      {page !== 'user-information' && page !== 'user-id' && (
        page === 'user-announcement' ? (
          <section className="resident-announcements">
            {announcements.length === 0 ? (
              <p className="resident-announcements__empty">No alert notifications have been published yet.</p>
            ) : announcements.map((announcement) => (
              <article className={`resident-announcement resident-announcement--${announcement.priority || 'medium'}`} key={announcement.id}>
                <div className="resident-announcement__heading">
                  <div>
                    <p>{announcement.type || 'Information'} · {announcement.audience === 'evacuees' ? 'Evacuees' : announcement.audience === 'barangay' ? announcement.barangay : 'All residents'}</p>
                    <h2>{announcement.title}</h2>
                  </div>
                  <div className="resident-announcement__actions">
                    <time>{announcement.createdAt?.toDate ? announcement.createdAt.toDate().toLocaleDateString() : 'Sending...'}</time>
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
