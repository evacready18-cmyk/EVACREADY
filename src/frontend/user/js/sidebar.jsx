import '../css/sidebar.css'

const userLinks = [
  { text: 'My Information', page: 'user-information' },
  { text: 'Request', page: 'user-request' },
  { text: 'Announcement', page: 'user-announcement' },
  { text: 'Feedback', page: 'user-feedback' },
  { text: 'Emergency Call', page: 'user-emergency-call' },
]

function UserSidebar({ current, navigate, onLogout }) {
  return (
    <aside className="user-sidebar">
      <div className="user-sidebar__brand">EVACREADY</div>
      <nav className="user-sidebar__nav" aria-label="User navigation">
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
            {link.text}
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
