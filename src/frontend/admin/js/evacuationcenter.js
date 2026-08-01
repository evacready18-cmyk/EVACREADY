import React from 'react'

const section = React.createElement

const EvacuationCenterPage = () =>
  section(
    'div',
    { className: 'page-panel' },
    section('h1', null, 'Evacuation Center'),
    section('p', null, 'Manage evacuation center details and availability.'),
  )

export default EvacuationCenterPage
