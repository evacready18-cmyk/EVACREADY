import React from 'react'
import '../css/evacmanage.css'
import { BARANGAYS } from '../../data/barangays.js'
import { USERS } from '../../data/users.js'

const section = React.createElement

const BARANGAY_SUMMARY = BARANGAYS.map((barangay, index) => ({
  id: index + 1,
  barangay,
  count: USERS.filter((user) => user.barangay === barangay).length,
}))

const EVACUEES = USERS

function EvacManagePage() {
  const [searchBarangay, setSearchBarangay] = React.useState('')
  const [selectedBarangay, setSelectedBarangay] = React.useState(BARANGAYS[0] || '')
  const [searchEvacuee, setSearchEvacuee] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const detailRef = React.useRef(null)

  const handleViewEvacuees = (barangay) => {
    setSelectedBarangay(barangay)
    setStatusFilter('All')
    setSearchEvacuee('')
    if (detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const filteredBarangays = React.useMemo(() => {
    const query = searchBarangay.trim().toLowerCase()
    if (!query) return BARANGAY_SUMMARY
    return BARANGAY_SUMMARY.filter((item) => item.barangay.toLowerCase().includes(query))
  }, [searchBarangay])

  const detailRows = React.useMemo(() => {
    const query = searchEvacuee.trim().toLowerCase()
    return EVACUEES.filter((row) => row.barangay === selectedBarangay)
      .filter((row) => statusFilter === 'All' || row.status === statusFilter)
      .filter((row) => {
        if (!query) return true
        return (
          row.evacueeId.toLowerCase().includes(query) ||
          row.name.toLowerCase().includes(query) ||
          row.contact.toLowerCase().includes(query) ||
          row.address.toLowerCase().includes(query)
        )
      })
  }, [searchEvacuee, statusFilter, selectedBarangay])

  return section(
    'div',
    { className: 'evacmanage-page' },
    section(
      'div',
      { className: 'evacmanage-header' },
      section('div', { className: 'evacmanage-title' },
        section('h2', null, 'Barangay List'),
      ),
      section(
        'div',
        { className: 'evacmanage-search' },
        section('input', {
          type: 'search',
          placeholder: 'Search barangay...',
          value: searchBarangay,
          onChange: (event) => setSearchBarangay(event.target.value),
        }),
        section('span', { className: 'search-icon' }, '🔍'),
      ),
    ),
    section(
      'div',
      { className: 'evacmanage-card' },
      section(
        'table',
        { className: 'summary-table' },
        section(
          'thead',
          null,
          section(
            'tr',
            null,
            section('th', null, '#'),
            section('th', null, 'BARANGAY'),
            section('th', null, 'TOTAL REGISTERED EVACUEES'),
            section('th', null, 'ACTION'),
          ),
        ),
        section(
          'tbody',
          null,
          filteredBarangays.map((item, index) =>
            section(
              'tr',
              {
                key: item.id,
                className: selectedBarangay === item.barangay ? 'summary-selected' : '',
              },
              section('td', null, String(index + 1)),
              section('td', null, item.barangay),
              section('td', null, String(item.count)),
              section(
                'td',
                null,
                section('button', {
                  className: 'view-evacuees-btn',
                  onClick: () => handleViewEvacuees(item.barangay),
                }, 'View Evacuees'),
              ),
            ),
          ),
        ),
      ),
      section(
        'div',
        { className: 'table-footer' },
        section('span', null, `Showing 1 to ${filteredBarangays.length} of ${BARANGAY_SUMMARY.length} entries`),
        section(
          'div',
          { className: 'pagination' },
          section('button', { className: 'page-btn active' }, '1'),
          section('button', { className: 'page-btn' }, 'Next'),
        ),
      ),
    ),
    section(
      'div',
      { className: 'detail-header', ref: detailRef },
      section('h3', null, `Registered Evacuees - ${selectedBarangay} (${BARANGAY_SUMMARY.find((item) => item.barangay === selectedBarangay)?.count || 0})`),
      section(
        'div',
        { className: 'detail-controls' },
        section('input', {
          type: 'search',
          placeholder: 'Search evacuee...',
          value: searchEvacuee,
          onChange: (event) => setSearchEvacuee(event.target.value),
        }),
        section('select', {
          value: statusFilter,
          onChange: (event) => setStatusFilter(event.target.value),
        },
          section('option', { value: 'All' }, 'All Status'),
          section('option', { value: 'Registered' }, 'Registered'),
          section('option', { value: 'Evacuated' }, 'Evacuated'),
          section('option', { value: 'Discharged' }, 'Discharged'),
        ),
        section('button', { className: 'export-btn' }, 'Export'),
      ),
    ),
    section(
      'div',
      { className: 'evacuees-card' },
      section(
        'table',
        { className: 'detail-table' },
        section(
          'thead',
          null,
          section(
            'tr',
            null,
            section('th', null, 'EVACUEE ID'),
            section('th', null, 'FULL NAME'),
            section('th', null, 'AGE'),
            section('th', null, 'SEX'),
            section('th', null, 'CONTACT NUMBER'),
            section('th', null, 'ADDRESS'),
            section('th', null, 'STATUS'),
            section('th', null, 'QR CODE'),
            section('th', null, 'ACTION'),
          ),
        ),
        section(
          'tbody',
          null,
          detailRows.map((row) =>
            section(
              'tr',
              { key: row.id, className: row.status === 'Evacuated' ? 'row-evacuated' : '' },
              section('td', null, row.evacueeId),
              section('td', null, row.name),
              section('td', null, String(row.age)),
              section('td', null, row.sex),
              section('td', null, row.contact),
              section('td', null, row.address),
              section('td', null, section('span', { className: `status-pill status-${row.status.toLowerCase()}` }, row.status)),
              section('td', null, section('div', { className: 'qr-code' }, 'QR')),
              section('td', null, section('button', { className: 'view-btn' }, 'View')),
            ),
          ),
        ),
      ),
      section(
        'div',
        { className: 'table-footer' },
        section('span', null, `Showing 1 to ${detailRows.length} of ${BARANGAY_SUMMARY.find((item) => item.barangay === selectedBarangay)?.count || 0} entries`),
        section(
          'div',
          { className: 'pagination' },
          section('button', { className: 'page-btn' }, '2'),
          section('button', { className: 'page-btn' }, '3'),
          section('button', { className: 'page-btn' }, '...'),
          section('button', { className: 'page-btn' }, 'Next'),
        ),
      ),
    ),
  )
}

export default EvacManagePage

