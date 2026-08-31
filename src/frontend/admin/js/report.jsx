import React from 'react'
import '../css/reports.css'
import { deleteEvacueeHistory, subscribeToEvacueeHistory } from '../../../services/firebase.js'

function formatTimestamp(timestamp, fallback = 'Not recorded') {
  return timestamp && typeof timestamp.toDate === 'function'
    ? timestamp.toDate().toLocaleString()
    : fallback
}

function timestampDate(timestamp) {
  return timestamp && typeof timestamp.toDate === 'function'
    ? timestamp.toDate().toISOString().slice(0, 10)
    : ''
}

function ReportPage({ barangay = '' }) {
  const [records, setRecords] = React.useState([])
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const [dateFilter, setDateFilter] = React.useState('')
  const [processingId, setProcessingId] = React.useState('')

  React.useEffect(() => subscribeToEvacueeHistory({ barangay }, setRecords), [barangay])

  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return records.filter((record) => {
      const matchesSearch = !query ||
        (record.residentName || '').toLowerCase().includes(query) ||
        (record.centerName || '').toLowerCase().includes(query) ||
        (record.barangay || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All' || record.status === statusFilter
      const matchesDate = !dateFilter || timestampDate(record.checkedInAt) === dateFilter || timestampDate(record.checkedOutAt) === dateFilter
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [records, search, statusFilter, dateFilter])

  const activeCount = records.filter((record) => record.status === 'Active').length
  const checkedOutCount = records.filter((record) => record.status === 'Checked out').length
  const reportTitle = barangay ? `Evacuee History Report - ${barangay}` : 'Evacuee History Report'

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete the evacuation history record for ${record.residentName || 'this resident'}?`)) return
    setProcessingId(record.id)
    try {
      await deleteEvacueeHistory(record.id)
    } catch (error) {
      alert(`Unable to delete history record: ${error.message}`)
    } finally {
      setProcessingId('')
    }
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <h1>{reportTitle}</h1>
          <p>Resident evacuation-center check-in and checkout documentation.</p>
        </div>
        <button className="report-print-button" type="button" onClick={() => window.print()}>Print Report</button>
      </header>

      <div className="report-print-heading">
        <h1>EvacReady</h1>
        <h2>{reportTitle}</h2>
        <p>Generated: {new Date().toLocaleString()}{dateFilter ? ` | Date filter: ${dateFilter}` : ''}</p>
      </div>

      <div className="metric-row">
        <article className="metric"><div className="metric-title">TOTAL RECORDS</div><div className="metric-value">{records.length}</div></article>
        <article className="metric"><div className="metric-title">CURRENTLY ACTIVE</div><div className="metric-value">{activeCount}</div></article>
        <article className="metric"><div className="metric-title">CHECKED OUT</div><div className="metric-value">{checkedOutCount}</div></article>
      </div>

      <section className="evacuees-table">
        <div className="report-controls">
          <input type="search" placeholder="Search resident, barangay, or center" value={search} onChange={(event) => setSearch(event.target.value)} />
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter by transaction date" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All transactions</option>
            <option value="Active">Active check-ins</option>
            <option value="Checked out">Checked out</option>
          </select>
        </div>
        <div className="report-table-wrap">
          <table>
            <thead><tr><th>RESIDENT</th><th>CONTACT</th><th>BARANGAY</th><th>EVACUATION CENTER</th><th>CHECK-IN TIME</th><th>CHECK-OUT TIME</th><th>STATUS</th><th className="report-actions-heading">ACTIONS</th></tr></thead>
            <tbody>
              {filteredRecords.map((record) => <tr key={record.id}>
                <td>{record.residentName || 'Resident'}</td>
                <td>{record.phone || 'Not provided'}</td>
                <td>{record.barangay || ''}</td>
                <td>{record.centerName || 'Not recorded'}</td>
                <td>{formatTimestamp(record.checkedInAt)}</td>
                <td>{formatTimestamp(record.checkedOutAt, record.status === 'Active' ? 'Still checked in' : 'Not recorded')}</td>
                <td><span className={`report-status-badge report-status-${(record.status || 'Active').replace(/\s+/g, '-').toLowerCase()}`}>{record.status || 'Active'}</span></td>
                <td className="report-actions">
                  <button type="button" className="report-action-button report-action-delete" disabled={processingId === record.id} onClick={() => handleDelete(record)}>{processingId === record.id ? 'Working...' : 'Delete'}</button>
                </td>
              </tr>)}
              {!filteredRecords.length && <tr><td colSpan="8">No evacuation transactions found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}

export default ReportPage
