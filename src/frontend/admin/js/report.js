import React from 'react'

const section = React.createElement

const ReportPage = () =>
  section(
    'div',
    { className: 'page-panel' },
    section('h1', null, 'Reports'),
    section('p', null, 'Generate and review incident reports here.'),
  )

export default ReportPage
