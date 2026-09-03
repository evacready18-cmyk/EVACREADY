import React from 'react'
import '../css/evacuationcenter.css'
import '../css/evacuationcenter-modal.css'
import { BARANGAYS } from '../../data/barangays.js'
import { createEvacuationCenter, deleteEvacuationCenter, subscribeToEvacuationCenters } from '../../../services/firebase.js'
import { uploadToCloudinary } from '../../../services/cloudinary.js'

const defaultImage = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'

function getStatus(capacity, availableSlots) {
  if (availableSlots < 1) return 'Full'
  if (availableSlots / capacity <= 0.2) return 'Almost Full'
  return 'Available'
}

function EvacuationCenterPage() {
  const [centers, setCenters] = React.useState([])
  const [search, setSearch] = React.useState('')
  const [barangay, setBarangay] = React.useState('All Barangays')
  const [status, setStatus] = React.useState('All Status')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [deletingCenterId, setDeletingCenterId] = React.useState('')
  const [newCenter, setNewCenter] = React.useState({ name: '', barangay: '', location: '', coords: '', capacity: '', imageUrl: '' })
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)

  React.useEffect(() => subscribeToEvacuationCenters(setCenters), [])

  const preparedCenters = React.useMemo(() => centers.map((center) => {
    const capacity = Number(center.capacity) || 0
    const availableSlots = Math.min(capacity, Math.max(0, Number(center.availableSlots) || 0))
    return { ...center, capacity, availableSlots, status: getStatus(capacity, availableSlots) }
  }), [centers])

  const filteredCenters = React.useMemo(() => preparedCenters.filter((center) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || center.name.toLowerCase().includes(query) || center.location.toLowerCase().includes(query) || center.barangay.toLowerCase().includes(query)
    return matchesSearch && (barangay === 'All Barangays' || center.barangay === barangay) && (status === 'All Status' || center.status === status)
  }), [preparedCenters, search, barangay, status])

  const totals = preparedCenters.reduce((summary, center) => ({ capacity: summary.capacity + center.capacity, available: summary.available + center.availableSlots }), { capacity: 0, available: 0 })
  const occupancy = totals.capacity - totals.available

  const updateField = (field) => (event) => setNewCenter((current) => ({ ...current, [field]: event.target.value }))
  const handleImageFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const imageUrl = await uploadToCloudinary(file)
      setNewCenter((current) => ({ ...current, imageUrl }))
    } catch (error) {
      alert(`Unable to upload image: ${error.message}`)
    } finally {
      setIsUploadingImage(false)
    }
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setNewCenter({ name: '', barangay: '', location: '', coords: '', capacity: '', imageUrl: '' })
  }

  const handleAddCenter = async () => {
    if (!newCenter.name.trim() || !newCenter.barangay || !newCenter.location.trim() || !newCenter.capacity) {
      alert('Please fill in the center name, barangay, location, and capacity.')
      return
    }
    setIsSaving(true)
    try {
      await createEvacuationCenter(newCenter)
      closeModal()
    } catch (error) {
      alert(`Unable to add evacuation center: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCenter = async (centerId) => {
    if (!window.confirm('Delete this evacuation center?')) return
    setDeletingCenterId(centerId)
    try {
      await deleteEvacuationCenter(centerId)
    } catch (error) {
      alert(`Unable to delete evacuation center: ${error.message}`)
    } finally {
      setDeletingCenterId('')
    }
  }

  return (
    <div className="evacuation-center-page">
      <div className="page-header">
        <div className="page-title-section"><h1>Evacuation Center Management</h1><p>Manage real-time capacity and available slots for evacuation centers.</p></div>
        <button className="add-center-btn" type="button" onClick={() => setIsModalOpen(true)}>+ Add Evacuation Center</button>
      </div>
      <div className="metric-cards">
        <article className="metric-card metric-card--centers"><div><div className="metric-card__label">TOTAL CENTERS</div><div className="metric-card__value">{preparedCenters.length}</div></div></article>
        <article className="metric-card metric-card--capacity"><div><div className="metric-card__label">TOTAL CAPACITY</div><div className="metric-card__value">{totals.capacity} Persons</div></div></article>
        <article className="metric-card metric-card--occupancy"><div><div className="metric-card__label">CURRENT OCCUPANCY</div><div className="metric-card__value">{occupancy} Persons</div></div></article>
        <article className="metric-card metric-card--slots"><div><div className="metric-card__label">AVAILABLE SLOTS</div><div className="metric-card__value">{totals.available} Persons</div></div></article>
      </div>
      <div className="filter-toolbar"><div className="filter-group">
        <input type="search" className="filter-search" placeholder="Search evacuation center..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={barangay} onChange={(event) => setBarangay(event.target.value)}><option value="All Barangays">All Barangays</option>{BARANGAYS.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All Status">All Status</option><option value="Available">Available</option><option value="Almost Full">Almost Full</option><option value="Full">Full</option></select>
      </div></div>
      <div className="evacuation-table-card">
        <table className="evacuation-table"><thead><tr><th>Evacuation Center</th><th>Location</th><th>Capacity</th><th>Occupancy</th><th>Available Slots</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {filteredCenters.map((center) => {
            const centerOccupancy = center.capacity - center.availableSlots
            const percentage = center.capacity ? Math.round((centerOccupancy / center.capacity) * 100) : 0
            return <tr key={center.id}>
              <td><div className="center-cell"><img src={center.imageUrl || defaultImage} alt={center.name} className="center-image" /><div className="center-info"><strong>{center.name}</strong><span>Brgy. {center.barangay}</span></div></div></td>
              <td><div className="location-cell"><span>{center.location}</span>{center.coords && <span className="coords">{center.coords}</span>}</div></td>
              <td><strong>{center.capacity} Persons</strong></td>
              <td><div className="occupancy-cell"><strong>{centerOccupancy}</strong><span>{percentage}%</span><div className="occupancy-bar"><div className="occupancy-fill" style={{ width: `${percentage}%` }} /></div></div></td>
              <td><span className="available-slots">{center.availableSlots} Slots</span></td>
              <td><span className={`status-badge status-${center.status.replace(/\s+/g, '-').toLowerCase()}`}>{center.status}</span></td>
              <td><div className="actions-group"><button type="button" className="action-button action-button--danger" disabled={deletingCenterId === center.id} onClick={() => handleDeleteCenter(center.id)}>{deletingCenterId === center.id ? 'Deleting...' : 'Delete'}</button></div></td>
            </tr>
          })}
          {!filteredCenters.length && <tr><td className="no-data" colSpan="7">No evacuation centers found.</td></tr>}
        </tbody></table>
        <div className="table-footer"><span>Showing {filteredCenters.length} of {preparedCenters.length} centers</span></div>
      </div>
      {isModalOpen && <div className="modal-overlay" onClick={closeModal}><div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header"><h2 className="modal-title">Add Evacuation Center</h2><button className="modal-close" type="button" onClick={closeModal} aria-label="Close">x</button></div>
        <div className="modal-body"><div className="form-grid">
          <label className="form-group"><span className="form-label">Center Name</span><input className="form-input" value={newCenter.name} onChange={updateField('name')} /></label>
          <label className="form-group"><span className="form-label">Barangay</span><select className="form-input" value={newCenter.barangay} onChange={updateField('barangay')}><option value="">Select barangay</option>{BARANGAYS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="form-group"><span className="form-label">Location</span><input className="form-input" value={newCenter.location} onChange={updateField('location')} /></label>
          <label className="form-group"><span className="form-label">Coordinates</span><input className="form-input" value={newCenter.coords} onChange={updateField('coords')} placeholder="Optional coordinates" /></label>
          <label className="form-group"><span className="form-label">Capacity</span><input className="form-input" type="number" min="1" value={newCenter.capacity} onChange={updateField('capacity')} /></label>
          <label className="form-group"><span className="form-label">Center Image</span><input className="form-input" type="file" accept="image/*" onChange={handleImageFileChange} disabled={isUploadingImage} />{isUploadingImage && <span className="form-hint">Uploading...</span>}</label>
        </div><div className="image-preview-wrapper"><img className="image-preview" src={newCenter.imageUrl || defaultImage} alt="Center preview" /></div></div>
        <div className="modal-actions"><button className="button button--secondary" type="button" onClick={closeModal} disabled={isSaving}>Cancel</button><button className="button button--primary" type="button" onClick={handleAddCenter} disabled={isSaving || isUploadingImage}>{isSaving ? 'Adding...' : 'Add Center'}</button></div>
      </div></div>}
    </div>
  )
}

export default EvacuationCenterPage
