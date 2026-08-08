import React from 'react'
import '../css/home.css'

const homeLinks = [
  { text: 'Dashboard', href: '#', active: true },
  { text: 'Alert and Notification', href: '/admin/alert' },
  { text: 'Evacuees Management', href: '/admin/evacmanage' },
  { text: 'Evacuation Center', href: '/admin/evacuationcenter' },
  { text: 'Reports', href: '/admin/report' },
  { text: 'Settings', href: '/admin/settings' },
  { text: 'User Management', href: '#' },
]

const section = React.createElement

function Home({ navigate }) {
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return section(
    'div',
    { className: 'home-page' },
    section(
      'section',
      { className: 'home-header' },
      section(
        'div',
        null,
        section('p', { className: 'home-subtitle' }, 'Welcome back, Admin!'),
        section('h1', null, 'Here’s what’s happening in Isabela today'),
      ),
      section(
        'div',
        { className: 'home-meta' },
        section('span', null, formattedDate),
        section('span', null, formattedTime),
      ),
    ),
    section(
      'section',
      { className: 'stats-grid' },
      section(
        'article',
        { className: 'stat-card stat-card--danger' },
        section('div', { className: 'stat-card__label' }, 'Affected Barangays'),
        section('div', { className: 'stat-card__value' }, '8/30'),
        section('span', { className: 'stat-card__icon' }, '📍'),
      ),
      section(
        'article',
        { className: 'stat-card stat-card--alert' },
        section('div', { className: 'stat-card__label' }, 'Active Alerts'),
        section('div', { className: 'stat-card__value' }, '4'),
        section('span', { className: 'stat-card__icon' }, '❗'),
      ),
      section(
        'article',
        { className: 'stat-card stat-card--info' },
        section('div', { className: 'stat-card__label' }, 'Evacuees'),
        section('div', { className: 'stat-card__value' }, '300'),
        section('span', { className: 'stat-card__icon' }, '👥'),
      ),
      section(
        'article',
        { className: 'stat-card stat-card--success' },
        section('div', { className: 'stat-card__label' }, 'Evacuation center'),
        section('div', { className: 'stat-card__value' }, '6'),
        section('span', { className: 'stat-card__icon' }, '🏠'),
      ),
    ),
    section(
      'section',
      { className: 'panels-grid' },
      section(
        'section',
        { className: 'panel panel--alerts' },
        section(
          'div',
          { className: 'panel-header' },
          section('h2', null, 'Recent Alerts'),
          section('a', { href: '#' }, 'View Alerts →'),
        ),
        section(
          'div',
          { className: 'alert-list' },
          section(
            'article',
            { className: 'alert-item alert-item--high' },
            section(
              'div',
              null,
              section('div', { className: 'alert-item__title' }, 'Heavy Rainfall Warning'),
              section('div', { className: 'alert-item__subtitle' }, 'General (Isabela)'),
            ),
            section(
              'div',
              { className: 'alert-item__meta' },
              section('span', null, 'May 24, 2026'),
              section('span', null, '8:30 AM'),
            ),
          ),
          section(
            'article',
            { className: 'alert-item alert-item--medium' },
            section(
              'div',
              null,
              section('div', { className: 'alert-item__title' }, 'Land slide Advisory'),
              section('div', { className: 'alert-item__subtitle' }, 'Barangay Mansablay'),
            ),
            section(
              'div',
              { className: 'alert-item__meta' },
              section('span', null, 'May 24, 2026'),
              section('span', null, '8:30 AM'),
            ),
          ),
          section(
            'article',
            { className: 'alert-item alert-item--medium' },
            section(
              'div',
              null,
              section('div', { className: 'alert-item__title' }, 'Flood Advisory'),
              section('div', { className: 'alert-item__subtitle' }, 'Barangay Bulad, Buhangin ...'),
            ),
            section(
              'div',
              { className: 'alert-item__meta' },
              section('span', null, 'May 24, 2026'),
              section('span', null, '8:30 AM'),
            ),
          ),
        ),
      ),
      section(
        'section',
        { className: 'panel panel--quick-action' },
        section(
          'div',
          { className: 'panel-header' },
          section('h2', null, 'Quick Action'),
        ),
        section(
          'div',
          { className: 'quick-actions' },
          section(
            'button',
            { className: 'action-card action-card--alert', type: 'button', onClick: () => navigate('alert') },
            section('span', null, '📣'),
            section('strong', null, 'Create Alert'),
          ),
          section(
            'button',
            { className: 'action-card action-card--center', type: 'button', onClick: () => navigate('evacuationcenter') },
            section('span', null, '🏠'),
            section('strong', null, 'Open Evacuation Center'),
          ),
          section(
            'button',
            { className: 'action-card action-card--evacuees', type: 'button', onClick: () => navigate('evacmanage') },
            section('span', null, '👥'),
            section('strong', null, 'Evacuees List'),
          ),
          section(
            'button',
            { className: 'action-card action-card--report', type: 'button', onClick: () => navigate('report') },
            section('span', null, '📝'),
            section('strong', null, 'Generate Report'),
          ),
        ),
      ),
      section(
        'section',
        { className: 'panel panel--hotline' },
        section(
          'div',
          { className: 'panel-header' },
          section('h2', null, 'Emergency Hotline'),
        ),
        section(
          'div',
          { className: 'hotline-list' },
          section('div', { className: 'hotline-item' }, 'LDRRMO – 0951 682 150'),
          section('div', { className: 'hotline-item' }, 'MHO Isabela – 0963 156 6032'),
          section('div', { className: 'hotline-item' }, 'BFP – 0970 465 9383'),
          section('div', { className: 'hotline-item' }, 'PNP Isabela – 0999 415 476'),
          section('div', { className: 'hotline-item' }, 'NOCECO – 0998 570 2725'),
        ),
      ),
    ),
  )
}

export default Home
