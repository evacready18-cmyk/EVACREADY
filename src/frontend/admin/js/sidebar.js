import React from 'react'
import { Menu, X } from 'lucide-react'
import '../css/sidebar.css'

const sidebarLinks = [
  { text: 'Dashboard', page: 'dashboard' },
  { text: 'Alert', page: 'alert' },
  { text: 'Usually Flooded Barangays', page: 'flood-prone' },
  { text: 'System Notification', page: 'notifications' },
  { text: 'Evacuees Management', page: 'evacmanage' },
  { text: 'Evacuation Center', page: 'evacuationcenter' },
  { text: 'Reports', page: 'report' },
  { text: 'Settings', page: 'settings' },
  { text: 'User Management', page: 'usermanagement' },
]

const Sidebar = ({ current, navigate, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return React.createElement(
    'aside',
    { className: `sidebar${isMenuOpen ? ' sidebar--open' : ''}` },
    React.createElement(
      'div',
      { className: 'sidebar-topbar' },
      React.createElement(
        'button',
        {
          className: 'sidebar-menu-toggle',
          type: 'button',
          'aria-label': isMenuOpen ? 'Close menu' : 'Open menu',
          'aria-expanded': isMenuOpen,
          onClick: () => setIsMenuOpen((open) => !open),
        },
        isMenuOpen ? React.createElement(X, { 'aria-hidden': true, size: 22 }) : React.createElement(Menu, { 'aria-hidden': true, size: 22 }),
      ),
      React.createElement('div', { className: 'sidebar-brand' }, 'EVACREADY'),
    ),
    React.createElement(
      'nav',
      { className: 'sidebar-nav', 'aria-label': 'Admin navigation' },
      sidebarLinks.map((link) =>
        React.createElement(
          'a',
          {
            key: link.text,
            href: '#',
            className: `sidebar-link${current === link.page ? ' active' : ''}`,
            onClick: (event) => {
              event.preventDefault()
              navigate(link.page)
              setIsMenuOpen(false)
            },
          },
          link.text,
        ),
      ),
    ),
    React.createElement(
      'button',
      { className: 'sidebar-logout', type: 'button', onClick: onLogout },
      'Log out',
    ),
  )
}

export default Sidebar
