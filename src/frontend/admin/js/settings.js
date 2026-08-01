import React from 'react'

const section = React.createElement

const SettingsPage = () =>
  section(
    'div',
    { className: 'page-panel' },
    section('h1', null, 'Settings'),
    section('p', null, 'Adjust application settings on this page.'),
  )

export default SettingsPage
