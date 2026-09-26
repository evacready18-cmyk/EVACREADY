import React, { useState } from 'react'
import '../css/alert.css'
import { createAnnouncement, deleteAnnouncement, subscribeToAnnouncements, subscribeToDismissedAnnouncements } from '../../../services/firebase.js'

const section = React.createElement

const AlertPage = ({ audienceFilter = null, barangayScope = '', notificationsOnly = false, canDeleteNotifications = false }) => {
  const [alertType, setAlertType] = useState('Information')
  const [channel, setChannel] = useState('sms')
  const [audience, setAudience] = useState('all')
  const [priority, setPriority] = useState('medium')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)
  const [filterType, setFilterType] = useState('All Types')
  const [filterDate, setFilterDate] = useState('All Dates')
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationPage, setNotificationPage] = useState(1)
  const [currentTime] = useState(() => Date.now())

  const [notifications, setNotifications] = useState([])
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([])

  React.useEffect(() => {
    return subscribeToAnnouncements(setNotifications, audienceFilter, barangayScope)
  }, [audienceFilter, barangayScope])
  React.useEffect(() => {
    if (!notificationsOnly) return undefined
    return subscribeToDismissedAnnouncements(setDismissedNotificationIds)
  }, [notificationsOnly])

  const formatDate = (createdAt) => createdAt?.toDate
    ? createdAt.toDate().toISOString().split('T')[0]
    : 'Sending...'

  const filteredNotifications = notifications
    .filter((notification) => !dismissedNotificationIds.includes(notification.id))
    .filter((notification) =>
      filterType === 'All Types' ? true : notification.type === filterType,
    )
    .filter((notification) =>
      filterDate === 'All Dates'
        ? true
        : filterDate === 'Today'
        ? notification.createdAt?.toDate && notification.createdAt.toDate().toDateString() === new Date().toDateString()
        : filterDate === 'This Week'
        ? notification.createdAt?.toDate && notification.createdAt.toDate() >= new Date(currentTime - 7 * 24 * 60 * 60 * 1000)
        : true,
    )
    .filter((notification) =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  const notificationsPerPage = 3
  const notificationPageCount = Math.max(1, Math.ceil(filteredNotifications.length / notificationsPerPage))
  const safeNotificationPage = Math.min(notificationPage, notificationPageCount)
  const visibleNotifications = filteredNotifications.slice(
    (safeNotificationPage - 1) * notificationsPerPage,
    safeNotificationPage * notificationsPerPage,
  )

  const handleDismissNotification = async (notificationId) => {
    try {
      await deleteAnnouncement(notificationId)
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Unable to delete notification.' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!title.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please enter both a title and a message.' })
      return
    }

    try {
      await createAnnouncement({ channel, type: alertType, audience, priority, title, message, barangay: audience === 'barangay' ? barangayScope : undefined })
      setStatus({ type: 'success', text: `${channel === 'sms' ? 'SMS' : 'Web'} alert sent successfully!` })
      setTitle('')
      setMessage('')
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Unable to send alert.' })
    }
  }

  const handleCancel = (event) => {
    event.preventDefault()
    setAlertType('Information')
    setChannel('sms')
    setAudience('all')
    setPriority('medium')
    setTitle('')
    setMessage('')
    setStatus(null)
  }

  return section(
    'div',
    { className: 'dashboard-card alert-page' },
      section(
        'div',
        { className: 'page-header' },
        section('h1', null, notificationsOnly ? 'System Notification' : `Create Alert for ${channel === 'sms' ? 'SMS' : 'Web'}`),
        section('p', null, notificationsOnly ? 'Review and manage recent system notifications.' : `Choose an alert type, target audience, priority, and compose your ${channel === 'sms' ? 'SMS' : 'Web'} alert.`),
      ),
    status &&
      section(
        'div',
        { className: `alert-status alert-status--${status.type}` },
        status.text,
      ),
    section(
      'div',
      { className: `alert-layout${notificationsOnly ? ' alert-layout--notifications-only' : ' alert-layout--alert-only'}` },
      !notificationsOnly && section(
        'form',
        { className: 'alert-form', onSubmit: handleSubmit },
        section(
          'div',
          { className: 'alert-form__grid' },
          section(
            'div',
            { className: 'form-group' },
            section('label', { htmlFor: 'alert-type' }, 'Alert Type'),
            section(
              'select',
              {
                id: 'alert-type',
                value: alertType,
                onChange: (event) => setAlertType(event.target.value),
              },
              section('option', { value: 'Information' }, 'Information'),
              section('option', { value: 'Warning' }, 'Warning'),
              section('option', { value: 'Evacuation' }, 'Evacuation'),
              section('option', { value: 'Advisory' }, 'Advisory'),
            ),
          ),
          section(
            'div',
            { className: 'form-group' },
            section('label', { htmlFor: 'audience' }, 'Target Audience'),
            section(
              'select',
              {
                id: 'audience',
                value: audience,
                onChange: (event) => setAudience(event.target.value),
              },
              section('option', { value: 'evacuees' }, 'Evacuees'),
              section('option', { value: 'staff' }, 'Staff'),
              section('option', { value: 'all' }, 'All Residents'),
              barangayScope && section('option', { value: 'barangay' }, `My Barangay (${barangayScope})`),
            ),
          ),
          section(
            'div',
            { className: 'form-group' },
            section('label', { htmlFor: 'alert-channel' }, 'Delivery Channel'),
            section(
              'select',
              {
                id: 'alert-channel',
                value: channel,
                onChange: (event) => setChannel(event.target.value),
              },
              section('option', { value: 'sms' }, 'SMS'),
              section('option', { value: 'web' }, 'Web'),
            ),
          ),
          section(
            'div',
            { className: 'form-group' },
            section('label', { htmlFor: 'priority' }, 'Priority'),
            section(
              'select',
              {
                id: 'priority',
                value: priority,
                onChange: (event) => setPriority(event.target.value),
              },
              section('option', { value: 'low' }, 'Low'),
              section('option', { value: 'medium' }, 'Medium'),
              section('option', { value: 'high' }, 'High'),
            ),
          ),
        ),
        section(
          'div',
          { className: 'form-group' },
          section('label', { htmlFor: 'alert-title' }, 'Alert Title'),
          section('input', {
            id: 'alert-title',
            type: 'text',
            value: title,
            placeholder: 'Enter your alert title',
            onChange: (event) => setTitle(event.target.value),
          }),
        ),
        section(
          'div',
          { className: 'form-group' },
          section('label', { htmlFor: 'alert-message' }, 'Message'),
          section('textarea', {
            id: 'alert-message',
            value: message,
            placeholder: 'Type the alert message here',
            onChange: (event) => setMessage(event.target.value),
          }),
        ),
        section(
          'div',
          { className: 'alert-form-actions' },
          section('button', { className: 'button button--cancel', type: 'button', onClick: handleCancel }, 'Cancel'),
          section('button', { className: 'button button--send', type: 'submit' }, 'Send Alert'),
        ),
      ),
      notificationsOnly && section(
        'aside',
        { className: `notification-panel${notificationsOnly ? ' notification-panel--standalone' : ''}` },
        section(
          'div',
          { className: 'notification-header' },
          section('h2', null, 'System Notification'),
          section(
            'div',
            { className: 'notification-filter' },
            section('button', {
              type: 'button',
              className: 'button button--filter',
              onClick: () => {
                setFilterType(
                  filterType === 'All Types'
                    ? 'Information'
                    : filterType === 'Information'
                    ? 'Warning'
                    : filterType === 'Warning'
                    ? 'Evacuation'
                    : filterType === 'Evacuation'
                    ? 'Advisory'
                    : 'All Types',
                )
                setNotificationPage(1)
              },
            }, filterType),
            section('button', {
              type: 'button',
              className: 'button button--filter',
              onClick: () => {
                setFilterDate(filterDate === 'All Dates' ? 'Today' : filterDate === 'Today' ? 'This Week' : 'All Dates')
                setNotificationPage(1)
              },
            }, filterDate),
          ),
        ),
        section('input', {
          className: 'notification-search',
          type: 'search',
          placeholder: 'Search old notifications...',
          value: searchQuery,
          onChange: (event) => {
            setSearchQuery(event.target.value)
            setNotificationPage(1)
          },
        }),
        section(
          'div',
          { className: 'notification-table-wrap' },
          section(
            'table',
            { className: 'notification-table' },
            section('thead', null, section('tr', null,
              section('th', null, 'Title'),
              section('th', null, 'Type'),
              section('th', null, 'Date'),
              section('th', null, 'Message'),
              canDeleteNotifications && section('th', { className: 'notification-table__action-heading' }, 'Action'),
            )),
            section(
              'tbody',
              null,
              visibleNotifications.length === 0
                ? section('tr', null, section('td', { colSpan: canDeleteNotifications ? 5 : 4, className: 'notification-empty' }, 'No notifications found.'))
                : visibleNotifications.map((notification) => section('tr', { key: notification.id },
                    section('td', { className: 'notification-table__title' }, notification.title),
                    section('td', null, section('span', { className: `notification-type notification-type--${notification.type.toLowerCase()}` }, notification.type)),
                    section('td', { className: 'notification-table__date' }, formatDate(notification.createdAt)),
                    section('td', { className: 'notification-table__message' }, notification.message),
                    canDeleteNotifications && section('td', { className: 'notification-table__action' }, section('button', {
                      className: 'notification-item__delete',
                      type: 'button',
                      onClick: () => handleDismissNotification(notification.id),
                      'aria-label': `Delete ${notification.title} notification`,
                    }, 'Delete')),
                  )),
            ),
          ),
        ),
        notificationPageCount > 1 && section(
          'nav',
          { className: 'notification-pagination', 'aria-label': 'Notification pages' },
          Array.from({ length: notificationPageCount }, (_, index) => {
            const page = index + 1
            return section(
              'button',
              {
                key: page,
                type: 'button',
                className: `notification-page-number${safeNotificationPage === page ? ' is-active' : ''}`,
                onClick: () => setNotificationPage(page),
                'aria-label': `View notification page ${page}`,
                'aria-current': safeNotificationPage === page ? 'page' : undefined,
              },
              page,
            )
          }),
        ),
      ),
    ),
  )
}

export default AlertPage
