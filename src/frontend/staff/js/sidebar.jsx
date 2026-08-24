import '../css/sidebar.css'

const staffLinks = [
  { text: 'Evacuees', page: 'staff-evacuees' },
  { text: 'Alert & Notification', page: 'staff-alert' },
  { text: 'Evacuation Center', page: 'staff-evacuation-center' },
  { text: 'Report and Analytics', page: 'staff-report' },
  { text: 'Settings', page: 'staff-settings' },
]

function StaffSidebar({ current, navigate, onLogout }) {
  return (
    <aside className="staff-sidebar">
      <div className="staff-sidebar__brand">EVACREADY</div>
      <nav className="staff-sidebar__nav" aria-label="Staff navigation">
        {staffLinks.map((link) => (
          <a
            className={`staff-sidebar__link${current === link.page ? ' active' : ''}`}
            href="#"
            key={link.page}
            onClick={(event) => {
              event.preventDefault()
              navigate(link.page)
            }}
          >
            {link.text}
          </a>
        ))}
      </nav>
      <button className="staff-sidebar__logout" type="button" onClick={onLogout}>
        Log out
      </button>
    </aside>
  )
}

export default StaffSidebar
