import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import '../css/sidebar.css'

const staffLinks = [
  { text: 'Evacuees', page: 'staff-evacuees' },
  { text: 'User Management', page: 'staff-usermanagement' },
  { text: 'Alert', page: 'staff-alert' },
  { text: 'System Notification', page: 'staff-notifications' },
  { text: 'Evacuation Center', page: 'staff-evacuation-center' },
  { text: 'Reports', page: 'staff-report' },
  { text: 'Settings', page: 'staff-settings' },
]

function StaffSidebar({ current, navigate, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavigate = (page) => {
    navigate(page)
    setIsMenuOpen(false)
  }

  return (
    <aside className={`staff-sidebar${isMenuOpen ? ' staff-sidebar--open' : ''}`}>
      <div className="staff-sidebar__topbar">
        <button
          className="staff-sidebar__menu-toggle"
          type="button"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" size={22} strokeWidth={2.5} /> : <Menu aria-hidden="true" size={22} strokeWidth={2.5} />}
        </button>
        <span className="staff-sidebar__brand">EVACREADY</span>
      </div>
      <div className="staff-sidebar__panel">
        <nav className="staff-sidebar__nav" aria-label="Staff navigation">
          {staffLinks.map((link) => (
            <a
              className={`staff-sidebar__link${current === link.page ? ' active' : ''}`}
              href="#"
              key={link.page}
              onClick={(event) => {
                event.preventDefault()
                handleNavigate(link.page)
              }}
            >
              {link.text}
            </a>
          ))}
        </nav>
        <button className="staff-sidebar__logout" type="button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  )
}

export default StaffSidebar
