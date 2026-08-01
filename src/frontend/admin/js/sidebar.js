import React from 'react'
import '../css/sidebar.css'

const sidebarLinks = [
  { text: 'Dashboard', page: 'dashboard' },
  { text: 'Alert and Notification', page: 'alert' },
  { text: 'Evacuees Management', page: 'evacmanage' },
  { text: 'Evacuation Center', page: 'evacuationcenter' },
  { text: 'Reports', page: 'report' },
  { text: 'Settings', page: 'settings' },
  { text: 'User Management', page: 'usermanagement' },
]

const Sidebar = ({ current, navigate }) =>
  React.createElement(
    'aside',
    { className: 'sidebar' },
    React.createElement('div', { className: 'sidebar-brand' }, 'EVACREADY'),
    React.createElement(
      'nav',
      { className: 'sidebar-nav' },
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
            },
          },
          link.text,
        ),
      ),
    ),
  )

export default Sidebar
