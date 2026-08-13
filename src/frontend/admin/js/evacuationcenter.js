import React from 'react'
import '../css/evacuationcenter.css'
import '../css/evacuationcenter-modal.css'

const section = React.createElement

const CENTERS = [
  {
    id: 1,
    name: 'Evacuation Center 1',
    barangay: 'A, Isabela',
    location: 'Purok 2, Near Elementary School',
    coords: '16.5701° N, 121.7593° E',
    capacity: 500,
    occupancy: 320,
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Evacuation Center 2',
    barangay: 'B, Isabela',
    location: 'Purok 1, Community Center',
    coords: '16.5624° N, 121.7450° E',
    capacity: 300,
    occupancy: 285,
    status: 'Almost Full',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Evacuation Center 3',
    barangay: 'C, Isabela',
    location: 'Purok 3, Covered Court',
    coords: '16.5580° N, 121.7321° E',
    capacity: 700,
    occupancy: 700,
    status: 'Full',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Evacuation Center 4',
    barangay: 'D, Isabela',
    location: 'Purok 4, Barangay Hall',
    coords: '16.5498° N, 121.7200° E',
    capacity: 400,
    occupancy: 120,
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Evacuation Center 5',
    barangay: 'E, Isabela',
    location: 'Purok 2, Old Gymnasium',
    coords: '16.5405° N, 121.7102° E',
    capacity: 600,
    occupancy: 450,
    status: 'Almost Full',
    image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
  },
]

function EvacuationCenterPage() {
  const [centers, setCenters] = React.useState(CENTERS)
  const [search, setSearch] = React.useState('')
  const [barangay, setBarangay] = React.useState('All Barangays')
  const [status, setStatus] = React.useState('All Status')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [newCenter, setNewCenter] = React.useState({
    name: '',
    barangay: '',
    location: '',
    coords: '',
    capacity: '',
    imageUrl: '',
    file: null,
  })
  const [imagePreview, setImagePreview] = React.useState('')
  const fileInputRef = React.useRef(null)
  const [editingCenterId, setEditingCenterId] = React.useState(null)

  const filteredCenters = React.useMemo(() => {
    return centers.filter((center) => {
      const matchesSearch =
        center.name.toLowerCase().includes(search.toLowerCase()) ||
        center.location.toLowerCase().includes(search.toLowerCase()) ||
        center.barangay.toLowerCase().includes(search.toLowerCase())
      const matchesBarangay = barangay === 'All Barangays' || center.barangay === barangay
      const matchesStatus = status === 'All Status' || center.status === status
      return matchesSearch && matchesBarangay && matchesStatus
    })
  }, [search, barangay, status, centers])

  const totalCapacity = centers.reduce((sum, center) => sum + center.capacity, 0)
  const totalOccupancy = centers.reduce((sum, center) => sum + center.occupancy, 0)
  const totalAvailable = totalCapacity - totalOccupancy

  const barangayOptions = React.useMemo(
    () => Array.from(new Set(centers.map((center) => center.barangay))),
    [centers],
  )

  const statusOptions = React.useMemo(
    () => Array.from(new Set(centers.map((center) => center.status))),
    [centers],
  )

  const updateField = (field) => (event) => {
    setNewCenter((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setNewCenter((prev) => ({ ...prev, file }))
    setImagePreview(URL.createObjectURL(file))
  }

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setNewCenter({
      name: '',
      barangay: '',
      location: '',
      coords: '',
      capacity: '',
      imageUrl: '',
      file: null,
    })
    setImagePreview('')
  }

  const handleAddCenter = () => {
    const capacity = Number(newCenter.capacity)
    if (!newCenter.name || !newCenter.barangay || !newCenter.location || !capacity) {
      alert('Please fill in name, barangay, location, and capacity.')
      return
    }

    const center = {
      id: centers.length + 1,
      name: newCenter.name,
      barangay: newCenter.barangay,
      location: newCenter.location,
      coords: newCenter.coords || 'N/A',
      capacity,
      occupancy: 0,
      status: 'Available',
      image: imagePreview || newCenter.imageUrl || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    }

    setCenters((prev) => [center, ...prev])
    handleCloseModal()
  }

  const handleDeleteCenter = (id) => {
    const ok = window.confirm('Are you sure you want to delete this evacuation center?')
    if (!ok) return
    setCenters((prev) => prev.filter((c) => c.id !== id))
  }

  const handleChangePhotoClick = (id) => {
    setEditingCenterId(id)
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handlePhotoFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setCenters((prev) => prev.map((c) => (c.id === editingCenterId ? { ...c, image: imageUrl } : c)))
    setEditingCenterId(null)
    event.target.value = ''
  }

  const modalElement = modalOpen
    ? section(
        'div',
        { className: 'modal-overlay' },
        section(
          'div',
          { className: 'modal-content' },
          section(
            'div',
            { className: 'modal-header' },
            section('h2', { className: 'modal-title' }, 'Add Evacuation Center'),
            section('button', { className: 'modal-close', type: 'button', onClick: handleCloseModal }, '✕'),
          ),
          section(
            'div',
            { className: 'modal-body' },
            section(
              'div',
              { className: 'form-grid' },
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Center Name'),
                section('input', {
                  className: 'form-input',
                  type: 'text',
                  value: newCenter.name,
                  onChange: updateField('name'),
                  placeholder: 'Enter center name',
                }),
              ),
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Barangay'),
                section(
                  'select',
                  {
                    className: 'form-input',
                    value: newCenter.barangay,
                    onChange: updateField('barangay'),
                  },
                  section('option', { value: '' }, 'Select barangay'),
                  ...barangayOptions.map((value) => section('option', { key: value, value }, value)),
                ),
              ),
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Location'),
                section('input', {
                  className: 'form-input',
                  type: 'text',
                  value: newCenter.location,
                  onChange: updateField('location'),
                  placeholder: 'Enter location details',
                }),
              ),
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Coordinates'),
                section('input', {
                  className: 'form-input',
                  type: 'text',
                  value: newCenter.coords,
                  onChange: updateField('coords'),
                  placeholder: 'e.g. 16.5701° N, 121.7593° E',
                }),
              ),
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Capacity'),
                section('input', {
                  className: 'form-input',
                  type: 'number',
                  min: '0',
                  value: newCenter.capacity,
                  onChange: updateField('capacity'),
                  placeholder: 'Total capacity',
                }),
              ),
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Image URL'),
                section('input', {
                  className: 'form-input',
                  type: 'text',
                  value: newCenter.imageUrl,
                  onChange: updateField('imageUrl'),
                  placeholder: 'Optional direct image URL',
                }),
              ),
              section(
                'label',
                { className: 'form-group' },
                section('span', { className: 'form-label' }, 'Upload Image'),
                section('input', {
                  className: 'form-input',
                  type: 'file',
                  accept: 'image/*',
                  onChange: handleImageChange,
                }),
              ),
            ),
            section(
              'div',
              { className: 'image-preview-wrapper' },
              imagePreview
                ? section('img', { className: 'image-preview', src: imagePreview, alt: 'Preview' })
                : section('div', { className: 'image-preview-placeholder' }, 'Image preview will appear here'),
            ),
          ),
          section(
            'div',
            { className: 'modal-actions' },
            section('button', { className: 'button button--secondary', type: 'button', onClick: handleCloseModal }, 'Cancel'),
            section('button', { className: 'button button--primary', type: 'button', onClick: handleAddCenter }, 'Add Center'),
          ),
        ),
      )
    : null

  return section(
    'div',
    { className: 'evacuation-center-page' },
    section(
      'div',
      { className: 'page-header' },
      section(
        'div',
        { className: 'page-title-section' },
        section('h1', null, 'Evacuation Center Management'),
        section('p', null, 'View real-time availability, occupancy, and location of all evacuation centers.'),
      ),
      section(
        'button',
        { className: 'add-center-btn', type: 'button', onClick: handleOpenModal },
        '+ Add Evacuation Center',
      ),
    ),
    section(
      'div',
      { className: 'metric-cards' },
      section(
        'article',
        { className: 'metric-card metric-card--centers' },
        section('span', { className: 'metric-card__icon' }, '🏢'),
        section('div', null, section('div', { className: 'metric-card__label' }, 'TOTAL CENTERS'), section('div', { className: 'metric-card__value' }, String(centers.length))),
      ),
      section(
        'article',
        { className: 'metric-card metric-card--capacity' },
        section('span', { className: 'metric-card__icon' }, '👥'),
        section('div', null, section('div', { className: 'metric-card__label' }, 'TOTAL CAPACITY'), section('div', { className: 'metric-card__value' }, `${totalCapacity.toLocaleString()} Persons`)),
      ),
      section(
        'article',
        { className: 'metric-card metric-card--occupancy' },
        section('span', { className: 'metric-card__icon' }, '📊'),
        section('div', null, section('div', { className: 'metric-card__label' }, 'CURRENT OCCUPANCY'), section('div', { className: 'metric-card__value' }, `${totalOccupancy.toLocaleString()} Persons (${Math.round((totalOccupancy / totalCapacity) * 100)}%)`)),
      ),
      section(
        'article',
        { className: 'metric-card metric-card--slots' },
        section('span', { className: 'metric-card__icon' }, '⚡'),
        section('div', null, section('div', { className: 'metric-card__label' }, 'AVAILABLE SLOTS'), section('div', { className: 'metric-card__value' }, `${totalAvailable.toLocaleString()} Persons (${Math.round((totalAvailable / totalCapacity) * 100)}%)`)),
      ),
    ),
    section(
      'div',
      { className: 'filter-toolbar' },
      section('div', { className: 'filter-group' },
        section('input', {
          type: 'search',
          className: 'filter-search',
          placeholder: 'Search evacuation center...',
          value: search,
          onChange: (event) => setSearch(event.target.value),
        }),
        section('select', {
          value: barangay,
          onChange: (event) => setBarangay(event.target.value),
        },
          section('option', { value: 'All Barangays' }, 'All Barangays'),
          ...barangayOptions.map((value) => section('option', { key: value, value }, value)),
        ),
        section('select', {
          value: status,
          onChange: (event) => setStatus(event.target.value),
        },
          section('option', { value: 'All Status' }, 'All Status'),
          ...statusOptions.map((value) => section('option', { key: value, value }, value)),
        ),
      ),
      section('div', { className: 'filter-meta' },
        section('span', null, `Last updated: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}`),
      ),
    ),
    modalElement,
    section('input', { type: 'file', ref: fileInputRef, style: { display: 'none' }, accept: 'image/*', onChange: handlePhotoFileChange }),
    section(
      'div',
      { className: 'evacuation-table-card' },
      section(
        'table',
        { className: 'evacuation-table' },
        section(
          'thead',
          null,
          section(
            'tr',
            null,
            section('th', null, 'Evacuation Center'),
            section('th', null, 'Location'),
            section('th', null, 'Capacity'),
            section('th', null, 'Occupancy'),
            section('th', null, 'Available Slots'),
            section('th', null, 'Status'),
            section('th', null, 'Actions'),
          ),
        ),
        section(
          'tbody',
          null,
          filteredCenters.map((center) => {
            const ratio = Math.round((center.occupancy / center.capacity) * 100)
            const available = center.capacity - center.occupancy
            return section(
              'tr',
              { key: center.id },
              section(
                'td',
                null,
                section('div', { className: 'center-cell' },
                  section('img', { src: center.image, alt: center.name, className: 'center-image' }),
                  section('div', { className: 'center-info' },
                    section('strong', null, center.name),
                    section('span', null, `Brgy. ${center.barangay}`),
                  ),
                ),
              ),
              section(
                'td',
                null,
                section('div', { className: 'location-cell' },
                  section('span', null, center.location),
                  section('span', { className: 'coords' }, center.coords),
                ),
              ),
              section(
                'td',
                null,
                section('strong', null, `${center.capacity} Persons`),
              ),
              section(
                'td',
                null,
                section('div', { className: 'occupancy-cell' },
                  section('strong', null, `${center.occupancy}`),
                  section('span', null, `${ratio}%`),
                  section('div', { className: 'occupancy-bar' }, section('div', { className: 'occupancy-fill', style: { width: `${ratio}%` } })),
                ),
              ),
              section(
                'td',
                null,
                section('span', { className: 'available-slots' }, `${available} Slots`),
              ),
              section(
                'td',
                null,
                section('span', { className: `status-badge status-${center.status.replace(/\s+/g, '-').toLowerCase()}` }, center.status),
              ),
              section(
                'td',
                null,
                section('div', { className: 'actions-group' },
                  section('button', { type: 'button', className: 'action-button action-button--primary' }, 'View Evacuees'),
                  section('button', { type: 'button', className: 'action-button action-button--secondary' }, 'View Location'),
                  section('button', { type: 'button', className: 'action-button action-button--tertiary', onClick: () => handleChangePhotoClick(center.id) }, 'Change Photo'),
                  section('button', { type: 'button', className: 'action-button action-button--danger', onClick: () => handleDeleteCenter(center.id) }, 'Delete'),
                ),
              ),
            )
          }),
        ),
      ),
      section(
        'div',
        { className: 'table-footer' },
        section('span', null, `Showing ${filteredCenters.length} of ${centers.length} centers`),
        section('div', { className: 'pagination' },
          section('button', { className: 'page-btn active' }, '1'),
          section('button', { className: 'page-btn' }, '2'),
          section('button', { className: 'page-btn' }, '3'),
          section('button', { className: 'page-btn' }, 'Next'),
        ),
      ),
    ),
  )
}

export default EvacuationCenterPage
