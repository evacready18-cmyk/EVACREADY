import React from 'react'

const section = React.createElement

const UserManagementPage = () =>
  section(
    'div',
    { className: 'page-panel' },
    section('h1', null, 'User Management'),
    section('p', null, 'Manage user roles, access, and accounts on this page.'),
  )

export default UserManagementPage
