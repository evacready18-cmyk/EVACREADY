import React from 'react'

const section = React.createElement

const EvacManagePage = () =>
  section(
    'div',
    { className: 'page-panel' },
    section('h1', null, 'Evacuees Management'),
    section('p', null, 'Manage evacuee data and statuses here.'),
  )

export default EvacManagePage
