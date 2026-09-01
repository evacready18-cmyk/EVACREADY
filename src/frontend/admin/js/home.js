import React from 'react'
import '../css/home.css'
import { subscribeToActiveEvacuees, subscribeToAnnouncements, subscribeToEvacuationCenters } from '../../../services/firebase.js'

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

function Home({ navigate, onLogout, role = 'admin' }) {
  const [now, setNow] = React.useState(new Date())
  const [recentAlerts, setRecentAlerts] = React.useState([])
  const [alerts, setAlerts] = React.useState([])
  const [evacuees, setEvacuees] = React.useState([])
  const [centers, setCenters] = React.useState([])
  const roleLabel = role === 'user' ? 'Resident' : role.charAt(0).toUpperCase() + role.slice(1)

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => subscribeToAnnouncements((alerts) => {
    setAlerts(alerts)
    setRecentAlerts(alerts.slice(0, 3))
  }), [])
  React.useEffect(() => subscribeToActiveEvacuees({}, setEvacuees), [])
  React.useEffect(() => subscribeToEvacuationCenters(setCenters), [])

  const activeEvacuees = evacuees.filter((evacuee) => evacuee.status === 'Active')
  const affectedBarangays = new Set(activeEvacuees.map((evacuee) => evacuee.barangay).filter(Boolean)).size
  const availableCenters = centers.filter((center) => Number(center.availableSlots) > 0).length

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
        section('p', { className: 'home-subtitle' }, `Welcome back, ${roleLabel}!`),
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
        section('div', { className: 'stat-card__value' }, affectedBarangays),
        section('span', { className: 'stat-card__icon' }, '📍'),
      ),
      section(
        'article',
        { className: 'stat-card stat-card--alert' },
        section('div', { className: 'stat-card__label' }, 'Active Alerts'),
        section('div', { className: 'stat-card__value' }, alerts.length),
        section('span', { className: 'stat-card__icon' }, '❗'),
      ),
      section(
        'article',
        { className: 'stat-card stat-card--info' },
        section('div', { className: 'stat-card__label' }, 'Evacuees'),
        section('div', { className: 'stat-card__value' }, activeEvacuees.length),
        section('span', { className: 'stat-card__icon' }, '👥'),
      ),
      section(
        'article',
        { className: 'stat-card stat-card--success' },
        section('div', { className: 'stat-card__label' }, 'Available Evacuation Centers'),
        section('div', { className: 'stat-card__value' }, availableCenters),
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
          section('a', { href: '#', onClick: (event) => { event.preventDefault(); navigate('alert') } }, 'View Alerts →'),
        ),
        section(
          'div',
          { className: 'alert-list' },
          recentAlerts.length
            ? recentAlerts.map((alert) => {
              const sentAt = alert.createdAt?.toDate?.()
              const priority = alert.priority || 'medium'
              return section(
                'button',
                { className: `alert-item alert-item--${priority}`, type: 'button', key: alert.id, onClick: () => navigate('alert') },
                section(
                  'div',
                  null,
                  section('div', { className: 'alert-item__title' }, alert.title),
                  section('div', { className: 'alert-item__subtitle' }, `${alert.type || 'Information'} · ${alert.audience === 'evacuees' ? 'Evacuees' : alert.audience === 'staff' ? 'Staff' : 'All residents'}`),
                ),
                section(
                  'div',
                  { className: 'alert-item__meta' },
                  section('span', null, sentAt ? sentAt.toLocaleDateString() : 'Sending...'),
                  section('span', null, sentAt ? sentAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''),
                ),
              )
            })
            : section('p', { className: 'recent-alerts-empty' }, 'No alerts have been sent yet.'),
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
            { className: 'action-card action-card--center', type: 'button', onClick: () => navigate('evacmanage') },
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
          section('a', { className: 'hotline-item', href: 'tel:+63951682150' }, 'LDRRMO – 0951 682 150'),
          section('a', { className: 'hotline-item', href: 'tel:+639631566032' }, 'MHO Isabela – 0963 156 6032'),
          section('a', { className: 'hotline-item', href: 'tel:+639704659383' }, 'BFP – 0970 465 9383'),
          section('a', { className: 'hotline-item', href: 'tel:+63999415476' }, 'PNP Isabela – 0999 415 476'),
          section('a', { className: 'hotline-item', href: 'tel:+639985702725' }, 'NOCECO – 0998 570 2725'),
        ),
      ),
    ),
  )
}

export default Home
