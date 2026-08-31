import React from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import '../css/evacmanage.css'
import { activateResidentAtCenter, getUserProfile, subscribeToActiveEvacuees, subscribeToEvacuationCenters } from '../../../services/firebase.js'

function formatCheckInDate(timestamp) {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString()
  }
  return 'Just checked in'
}

function timestampDate(timestamp) {
  return timestamp && typeof timestamp.toDate === 'function'
    ? timestamp.toDate().toISOString().slice(0, 10)
    : ''
}

function formatCheckOutDate(timestamp, status) {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleString()
  }
  return status === 'Active' ? 'Still checked in' : 'Not recorded'
}

function EvacManagePage({ barangay = '' }) {
  const [evacuees, setEvacuees] = React.useState([])
  const [centers, setCenters] = React.useState([])
  const [search, setSearch] = React.useState('')
  const [dateFilter, setDateFilter] = React.useState('')
  const [isScannerOpen, setIsScannerOpen] = React.useState(false)
  const [selectedCenterId, setSelectedCenterId] = React.useState('')
  const [manualCode, setManualCode] = React.useState('')
  const [scannerError, setScannerError] = React.useState('')
  const [isCheckingIn, setIsCheckingIn] = React.useState(false)

  React.useEffect(() => subscribeToActiveEvacuees({ barangay }, setEvacuees), [barangay])
  React.useEffect(() => subscribeToEvacuationCenters(setCenters), [])

  const availableCenters = React.useMemo(() => centers.filter((center) => Number(center.availableSlots) > 0), [centers])

  React.useEffect(() => {
    if (!selectedCenterId || !availableCenters.some((center) => center.id === selectedCenterId)) {
      setSelectedCenterId(availableCenters[0]?.id || '')
    }
  }, [availableCenters, selectedCenterId])

  const closeScanner = () => {
    setIsScannerOpen(false)
    setScannerError('')
    setManualCode('')
  }

  const handleScannedResident = async (value) => {
    const residentUid = value.trim()
    if (!residentUid || !selectedCenterId || isCheckingIn) return

    setIsCheckingIn(true)
    try {
      const resident = await getUserProfile(residentUid)
      const sameBarangay = resident?.barangay?.trim().toLowerCase() === barangay.trim().toLowerCase()
      if (!resident || resident.role !== 'user' || !sameBarangay) {
        throw new Error('This QR code does not belong to a resident in your designated barangay.')
      }
      await activateResidentAtCenter(selectedCenterId, residentUid)
      closeScanner()
      alert(`${resident.name || 'Resident'} has been checked in successfully.`)
    } catch (error) {
      setScannerError(error.message)
    } finally {
      setIsCheckingIn(false)
    }
  }

  React.useEffect(() => {
    if (!isScannerOpen || !selectedCenterId) return undefined
    const scanner = new Html5Qrcode('staff-qr-reader')
    let isActive = true

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        scanner.pause(true)
        await handleScannedResident(decodedText)
      },
      () => {},
    ).catch(() => {
      if (isActive) setScannerError('Camera access is unavailable. Enter the QR code value manually below.')
    })

    return () => {
      isActive = false
      if (scanner.isScanning) scanner.stop().catch(() => {})
    }
  }, [isScannerOpen, selectedCenterId, barangay])

  const filteredEvacuees = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return evacuees.filter((evacuee) => {
      const matchesDate = !dateFilter || timestampDate(evacuee.checkedInAt) === dateFilter
      const matchesSearch = !query ||
        evacuee.residentName.toLowerCase().includes(query) ||
        evacuee.barangay.toLowerCase().includes(query) ||
        evacuee.centerName.toLowerCase().includes(query) ||
        evacuee.phone.toLowerCase().includes(query)
      return matchesDate && matchesSearch
    })
  }, [evacuees, search, dateFilter])

  const heading = barangay ? `Evacuees - ${barangay}` : 'All Evacuees'

  return (
    <div className="evacmanage-page">
      <div className="evacmanage-header">
        <div className="evacmanage-title">
          <h2>{heading}</h2>
          <p>Resident check-in and check-out records for evacuation centers.</p>
        </div>
        {barangay && <button className="scan-qr-btn" type="button" disabled={!availableCenters.length} onClick={() => setIsScannerOpen(true)}>Scan Resident QR</button>}
        <div className="evacmanage-search">
          <input type="search" placeholder="Search evacuees..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter evacuees by check-in date" />
      </div>
      <div className="evacuees-card">
        <table className="detail-table">
          <thead>
            <tr><th>RESIDENT</th><th>CONTACT NUMBER</th><th>BARANGAY</th><th>EVACUATION CENTER</th><th>CHECK-IN TIME</th><th>CHECK-OUT TIME</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {filteredEvacuees.map((evacuee) => (
              <tr key={evacuee.id} className="row-evacuated">
                <td>{evacuee.residentName}</td>
                <td>{evacuee.phone || 'Not provided'}</td>
                <td>{evacuee.barangay}</td>
                <td>{evacuee.centerName}</td>
                <td>{formatCheckInDate(evacuee.checkedInAt)}</td>
                <td>{formatCheckOutDate(evacuee.checkedOutAt, evacuee.status)}</td>
                <td><span className={`status-pill ${evacuee.status === 'Active' ? 'status-evacuated' : 'status-discharged'}`}>{evacuee.status}</span></td>
              </tr>
            ))}
            {!filteredEvacuees.length && <tr><td colSpan="7" className="no-data">No evacuee records found{barangay ? ` in ${barangay}` : ''}.</td></tr>}
          </tbody>
        </table>
        <div className="table-footer"><span>Showing {filteredEvacuees.length} evacuee records</span></div>
      </div>
      {isScannerOpen && <div className="qr-scanner-overlay" onClick={closeScanner}>
        <section className="qr-scanner-modal" onClick={(event) => event.stopPropagation()}>
          <div className="qr-scanner-header"><h3>Scan Resident QR</h3><button type="button" onClick={closeScanner} aria-label="Close QR scanner">x</button></div>
          <label className="qr-scanner-label">Evacuation center
            <select value={selectedCenterId} onChange={(event) => setSelectedCenterId(event.target.value)} disabled={isCheckingIn}>
              {availableCenters.map((center) => <option key={center.id} value={center.id}>{center.name} ({center.availableSlots} slots)</option>)}
            </select>
          </label>
          <div id="staff-qr-reader" className="qr-reader" />
          <label className="qr-scanner-label">Manual QR code
            <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Paste the resident QR value" disabled={isCheckingIn} />
          </label>
          {scannerError && <p className="qr-scanner-error">{scannerError}</p>}
          <div className="qr-scanner-actions"><button type="button" onClick={closeScanner} disabled={isCheckingIn}>Cancel</button><button type="button" onClick={() => handleScannedResident(manualCode)} disabled={!manualCode.trim() || isCheckingIn}>{isCheckingIn ? 'Checking in...' : 'Check in'}</button></div>
        </section>
      </div>}
    </div>
  )
}

export default EvacManagePage
