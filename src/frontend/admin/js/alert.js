import React, { useState } from 'react'
import '../css/alert.css'
import { createAnnouncement, dismissCurrentUserAnnouncement, subscribeToAnnouncements, subscribeToDismissedAnnouncements } from '../../../services/firebase.js'

const section = React.createElement

const AlertPage = ({ audienceFilter = null }) => {
  const [alertType, setAlertType] = useState('Information')
  const [audience, setAudience] = useState('all')
  const [priority, setPriority] = useState('medium')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(null)
  const [filterType, setFilterType] = useState('All Types')
  const [filterDate, setFilterDate] = useState('All Dates')
  const [searchQuery, setSearchQuery] = useState('')

  const [notifications, setNotifications] = useState([])
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([])

  React.useEffect(() => subscribeToAnnouncements(setNotifications, audienceFilter), [audienceFilter])
  React.useEffect(() => subscribeToDismissedAnnouncements(setDismissedNotificationIds), [])

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
        ? notification.createdAt?.toDate && notification.createdAt.toDate() >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : true,
    )
    .filter((notification) =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  const handleDismissNotification = async (notificationId) => {
    try {
      await dismissCurrentUserAnnouncement(notificationId)
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
      await createAnnouncement({ type: alertType, audience, priority, title, message })
      setStatus({ type: 'success', text: 'Alert sent successfully!' })
      setTitle('')
      setMessage('')
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Unable to send alert.' })
    }
  }

  const handleCancel = (event) => {
    event.preventDefault()
    setAlertType('Information')
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
      section('h1', null, 'Create Alert'),
      section('p', null, 'Choose an alert type, target audience, priority, and write your message.'),
    ),
    status &&
      section(
        'div',
        { className: `alert-status alert-status--${status.type}` },
        status.text,
      ),
    section(
      'div',
      { className: 'alert-layout' },
      section(
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
          section(
            'button',
            { className: 'button button--cancel', type: 'button', onClick: handleCancel },
            'Cancel',
          ),
          section(
            'button',
            { className: 'button button--send', type: 'submit' },
            'Send Alert',
          ),
        ),
      ),
      section(
        'aside',
        { className: 'notification-panel' },
        section(
          'div',
          { className: 'notification-header' },
          section('h2', null, 'System Notification'),
          section(
            'div',
            { className: 'notification-filter' },
            section(
              'button',
              {
                type: 'button',
                className: 'button button--filter',
                onClick: () =>
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
                  ),
              },
              filterType,
            ),
            section(
              'button',
              {
                type: 'button',
                className: 'button button--filter',
                onClick: () =>
                  setFilterDate(
                    filterDate === 'All Dates' ? 'Today' : filterDate === 'Today' ? 'This Week' : 'All Dates',
                  ),
              },
              filterDate,
            ),
          ),
        ),
        section(
          'input',
          {
            className: 'notification-search',
            type: 'search',
            placeholder: 'Search old notifications...',
            value: searchQuery,
            onChange: (event) => setSearchQuery(event.target.value),
          },
        ),
        section(
          'div',
          { className: 'notification-list' },
          filteredNotifications.length === 0
            ? section('div', { className: 'notification-empty' }, 'No notifications found.')
            : filteredNotifications.map((notification) =>
                section(
                  'div',
                  { key: notification.id, className: 'notification-item' },
                  section(
                    'div',
                    { className: 'notification-item__header' },
                    section('strong', null, notification.title),
                    section('button', {
                      className: 'notification-item__delete',
                      type: 'button',
                      onClick: () => handleDismissNotification(notification.id),
                      'aria-label': `Delete ${notification.title} notification`,
                    }, 'Delete'),
                    section('span', { className: 'notification-item__meta' }, `${notification.type} • ${formatDate(notification.createdAt)}`),
                  ),
                  section('p', { className: 'notification-item__message' }, notification.message),
                ),
              ),
        ),
      ),
    ),
  )
}

export default AlertPage
