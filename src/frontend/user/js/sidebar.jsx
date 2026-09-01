import { useEffect, useState } from 'react'
import { Bell, MessageSquareText, PhoneCall, UserRound } from 'lucide-react'
import '../css/sidebar.css'
import { subscribeToAnnouncements, subscribeToDismissedAnnouncements, subscribeToUserProfile } from '../../../services/firebase'

const userLinks = [
  { text: 'My Profile', page: 'user-information', Icon: UserRound },
  { text: 'Alert Notification', page: 'user-announcement' },
  { text: 'Feedback', page: 'user-feedback', Icon: MessageSquareText },
  { text: 'Emergency Call', page: 'user-emergency-call', Icon: PhoneCall },
]

function UserSidebar({ current, currentUid, navigate, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('evacready-settings') || '{}').notifications !== false
    } catch {
      return true
    }
  })

  useEffect(() => {
    const updateNotificationSetting = (event) => setNotificationsEnabled(event.detail?.notifications !== false)
    window.addEventListener('evacready-settings-changed', updateNotificationSetting)
    return () => window.removeEventListener('evacready-settings-changed', updateNotificationSetting)
  }, [])

  useEffect(() => {
    if (!currentUid) return undefined
    return subscribeToUserProfile(currentUid, setProfile)
  }, [currentUid])

  useEffect(() => {
    if (!profile) return undefined
    return subscribeToAnnouncements((announcements) => {
      const lastReadTime = profile.lastNotificationReadAt?.toMillis?.() || 0
      setUnreadCount(announcements.filter((announcement) =>
        !dismissedNotificationIds.includes(announcement.id) &&
        (announcement.createdAt?.toMillis?.() || 0) > lastReadTime,
      ).length)
    }, ['all', 'evacuees'])
  }, [profile, dismissedNotificationIds])

  useEffect(() => {
    if (!currentUid) return undefined
    return subscribeToDismissedAnnouncements(setDismissedNotificationIds)
  }, [currentUid])

  return (
    <aside className="user-sidebar">
      <div className="user-sidebar__brand">EVACREADY</div>
      <nav className="user-sidebar__nav" aria-label="Resident navigation">
        {userLinks.map((link) => (
          <a
            className={`user-sidebar__link${current === link.page ? ' active' : ''}`}
            href="#"
            key={link.page}
            onClick={(event) => {
              event.preventDefault()
              navigate(link.page)
            }}
          >
            {link.page === 'user-announcement' ? (
              <>
                <span>{link.text}</span>
                <span className="user-sidebar__notification-bell" aria-label={`${unreadCount} unread alerts`}>
                  <Bell aria-hidden="true" size={19} strokeWidth={2.5} />
                  {notificationsEnabled && unreadCount > 0 && (
                    <span className="user-sidebar__notification-count">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <span>{link.text}</span>
                <link.Icon className="user-sidebar__menu-icon" aria-hidden="true" size={19} strokeWidth={2.5} />
              </>
            )}
          </a>
        ))}
      </nav>
      <button className="user-sidebar__logout" type="button" onClick={onLogout}>
        Log out
      </button>
    </aside>
  )
}

export default UserSidebar
