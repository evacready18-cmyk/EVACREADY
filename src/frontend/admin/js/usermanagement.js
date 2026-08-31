import React from 'react'
import '../css/usermanagement.css'
import { BARANGAYS } from '../../data/barangays.js'
import { activateResidentAtCenter, createStaffAccount, deactivateResidentFromCenter, subscribeToEvacuationCenters, subscribeToUsers, updateUserProfileFields, deleteUserProfile } from '../../../services/firebase.js'

const section = React.createElement

function formatJoinDate(user) {
  if (user.createdAt && typeof user.createdAt.toDate === 'function') {
    return user.createdAt.toDate().toISOString().split('T')[0]
  }
  return ''
}

function normalizeUser(raw) {
  return {
    id: raw.uid,
    name: raw.name || '',
    email: raw.email || '',
    role: raw.role === 'user' ? 'Resident' : raw.role ? raw.role.charAt(0).toUpperCase() + raw.role.slice(1) : 'Resident',
    status: raw.status || 'Active',
    joinDate: formatJoinDate(raw),
    barangay: raw.barangay || '',
    verified: Boolean(raw.verified),
  }
}

function UserManagementPage({ allowedRole = 'Staff', barangay = '' } = {}) {
  const [users, setUsers] = React.useState([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const [selectedUser, setSelectedUser] = React.useState(null)
  const [actionType, setActionType] = React.useState(null)
  const [newName, setNewName] = React.useState('')
  const [newBarangay, setNewBarangay] = React.useState('')
  const [centers, setCenters] = React.useState([])
  const [activationUser, setActivationUser] = React.useState(null)
  const [activationCenterId, setActivationCenterId] = React.useState('')
  const [isActivating, setIsActivating] = React.useState(false)
  const [showCreateStaff, setShowCreateStaff] = React.useState(false)
  const [staffForm, setStaffForm] = React.useState({
    name: '',
    email: '',
    password: '',
    barangay: '',
  })

  React.useEffect(() => {
    const unsubscribe = subscribeToUsers({ role: allowedRole, barangay }, (rawUsers) => {
      setUsers(rawUsers.map(normalizeUser))
    })
    return unsubscribe
  }, [allowedRole, barangay])

  React.useEffect(() => {
    if (allowedRole === 'Staff') return undefined
    return subscribeToEvacuationCenters(setCenters)
  }, [allowedRole])

  const filteredUsers = React.useMemo(() => {
    let result = users
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      )
    }
    
    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(user => user.status === statusFilter)
    }
    
    return result
  }, [users, searchQuery, statusFilter])

  const handleAction = (user, action) => {
    setSelectedUser(user)
    setActionType(action)
    setNewName(user.name)
    setNewBarangay(user.barangay)
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setActionType(null)
    setNewName('')
    setNewBarangay('')
  }

  const handleVerifyUser = async (userId) => {
    try {
      await updateUserProfileFields(userId, { verified: true })
    } catch (error) {
      console.error('Error verifying user:', error)
      alert(`Error verifying user: ${error.message}`)
    }
    handleCloseModal()
  }

  const handleChangeName = async (userId) => {
    if (!newName.trim()) {
      alert('Please enter a name')
      return
    }
    try {
      await updateUserProfileFields(userId, { name: newName })
    } catch (error) {
      console.error('Error changing name:', error)
      alert(`Error changing name: ${error.message}`)
    }
    handleCloseModal()
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUserProfile(userId)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(`Error deleting user: ${error.message}`)
    }
    handleCloseModal()
  }

  const handleToggleStatus = async (user) => {
    if (user.status !== 'Active') {
      const availableCenters = centers.filter((center) => center.barangay === user.barangay && Number(center.availableSlots) > 0)
      setActivationCenterId(availableCenters[0]?.id || '')
      setActivationUser(user)
      return
    }
    try {
      await deactivateResidentFromCenter(user.id)
    } catch (error) {
      console.error('Error updating resident status:', error)
      alert(`Error updating resident status: ${error.message}`)
    }
  }

  const handleActivateAtCenter = async () => {
    if (!activationUser || !activationCenterId) return
    setIsActivating(true)
    try {
      await activateResidentAtCenter(activationCenterId, activationUser.id)
      alert(`${activationUser.name} is now active and has been added to Evacuees.`)
      setActivationUser(null)
      setActivationCenterId('')
    } catch (error) {
      console.error('Error activating resident:', error)
      alert(`Error activating resident: ${error.message}`)
    } finally {
      setIsActivating(false)
    }
  }

  const handleChangeBarangay = async (userId) => {
    if (!newBarangay.trim()) {
      alert('Please select a barangay')
      return
    }
    try {
      await updateUserProfileFields(userId, { barangay: newBarangay })
    } catch (error) {
      console.error('Error changing barangay:', error)
      alert(`Error changing barangay: ${error.message}`)
    }
    handleCloseModal()
  }

  const handleCreateStaff = async () => {
    if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password.trim() || !staffForm.barangay.trim()) {
      alert('Please fill in all fields')
      return
    }

    if (staffForm.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      // Register staff in Firebase without disturbing the admin's own session
      const firebaseUser = await createStaffAccount({
        email: staffForm.email,
        password: staffForm.password,
        name: staffForm.name,
        barangay: staffForm.barangay,
      })

      // Store staff role and barangay in localStorage
      const emailKey = `evacready-role:${staffForm.email.trim().toLowerCase()}`
      window.localStorage.setItem(emailKey, 'staff')
      window.localStorage.setItem(`${emailKey}-barangay`, staffForm.barangay)

      setShowCreateStaff(false)
      setStaffForm({ name: '', email: '', password: '', barangay: '' })
      alert(`Staff account created successfully!\n\nEmail: ${firebaseUser.email}\nPassword: ${staffForm.password}\n\nThe account is now available in Firebase and can be used to log in to the system.`)
    } catch (error) {
      console.error('Error creating staff account:', error)
      const message = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists. Please use a different email address.'
        : error.message
      alert(`Error creating staff account: ${message}`)
    }
  }

  const handleCloseCreateStaff = () => {
    setShowCreateStaff(false)
    setStaffForm({ name: '', email: '', password: '', barangay: '' })
  }

  return section(
    'div',
    { className: 'usermanagement-page' },
    section(
      'div',
      { className: 'usermanagement-header' },
      section(
        'div',
        null,
        section('h2', null, allowedRole === 'Staff' ? 'Staff Management' : 'User Management'),
        section('p', null, allowedRole === 'Staff' ? 'Manage staff roles, access, and accounts' : 'Manage resident roles, access, and accounts'),
      ),
      allowedRole === 'Staff' && section('button', {
        className: 'btn-create-staff',
        onClick: () => setShowCreateStaff(true),
      }, '+ Create Staff Account'),
    ),
    section(
      'div',
      { className: 'usermanagement-filters' },
      section(
        'div',
        { className: 'search-box' },
        section('input', {
          type: 'search',
          placeholder: 'Search by name or email...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
        }),
      ),
      section(
        'div',
        { className: 'filter-group' },
        section(
          'select',
          {
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
          },
          section('option', null, 'All Status'),
          section('option', null, 'Active'),
          section('option', null, 'Inactive'),
        ),
      ),
    ),
    section(
      'div',
      { className: 'usermanagement-table-container' },
      section(
        'table',
        { className: 'usermanagement-table' },
        section(
          'thead',
          null,
          section(
            'tr',
            null,
            section('th', null, 'Name'),
            section('th', null, 'Email'),
            section('th', null, 'Role'),
            section('th', null, 'Status'),
            section('th', null, 'Barangay'),
            section('th', null, 'Date Created'),
            section('th', null, 'Action'),
          ),
        ),
        section(
          'tbody',
          null,
          filteredUsers.length > 0 ? filteredUsers.map(user =>
            section(
              'tr',
              { key: user.id },
              section('td', null, user.name),
              section('td', null, user.email),
              section('td', null, 
                section('span', { className: `role-badge role-${user.role.toLowerCase()}` }, user.role)
              ),
              section('td', null,
                section('span', { className: `status-badge status-${user.status.toLowerCase()}` }, user.status)
              ),
              section('td', null, user.barangay),
              section('td', null, user.joinDate || 'Not recorded'),
              section('td', null,
                section(
                  'div',
                  { className: 'action-buttons' },
                  section('button', {
                    className: 'btn-action btn-verify',
                    onClick: () => handleAction(user, 'verify'),
                    disabled: user.verified,
                  }, user.verified ? '✓ Verified' : 'Verify'),
                  section('button', {
                    className: 'btn-action btn-edit',
                    onClick: () => handleAction(user, 'changeName'),
                  }, 'Change Name'),
                  section('button', {
                    className: 'btn-action btn-location',
                    onClick: () => handleAction(user, 'viewBarangay'),
                  }, 'View Barangay'),
                  allowedRole !== 'Staff' && section('button', {
                    className: 'btn-action btn-edit',
                    onClick: () => handleToggleStatus(user),
                  }, user.status === 'Active' ? 'Set Inactive' : 'Set Active'),
                  allowedRole === 'Staff' && section('button', {
                    className: 'btn-action btn-edit',
                    onClick: () => handleAction(user, 'changeBarangay'),
                  }, 'Change Barangay'),
                  section('button', {
                    className: 'btn-action btn-delete',
                    onClick: () => handleAction(user, 'delete'),
                  }, 'Delete'),
                )
              ),
            )
          ) : section(
            'tr',
            null,
            section('td', { colSpan: 7, className: 'no-data' }, allowedRole === 'Staff' ? 'No staff found' : `No residents found${barangay ? ` in ${barangay}` : ''}`)
          )
        ),
      ),
    ),
    // Modal for actions
    selectedUser && section(
      'div',
      { className: 'modal-overlay', onClick: handleCloseModal },
      section(
        'div',
        { className: 'modal-content', onClick: (e) => e.stopPropagation() },
        actionType === 'verify' && section(
          React.Fragment,
          null,
          section('h3', null, 'Verify Account?'),
          section('div', { className: 'modal-body' },
            section('p', null, `Are you sure you want to verify ${selectedUser.name}'s account?`),
          ),
          section(
            'div',
            { className: 'modal-actions' },
            section('button', { className: 'btn-cancel', onClick: handleCloseModal }, 'Cancel'),
            section('button', { className: 'btn-confirm', onClick: () => handleVerifyUser(selectedUser.id) }, 'Verify'),
          ),
        ),
        actionType === 'changeName' && section(
          React.Fragment,
          null,
          section('h3', null, 'Change Name'),
          section('div', { className: 'modal-body' },
            section('p', null, 'Enter the new name:'),
            section('input', {
              type: 'text',
              value: newName,
              onChange: (e) => setNewName(e.target.value),
              placeholder: 'Enter new name',
              className: 'modal-input',
            }),
          ),
          section(
            'div',
            { className: 'modal-actions' },
            section('button', { className: 'btn-cancel', onClick: handleCloseModal }, 'Cancel'),
            section('button', { className: 'btn-confirm', onClick: () => handleChangeName(selectedUser.id) }, 'Save'),
          ),
        ),
        actionType === 'viewBarangay' && section(
          React.Fragment,
          null,
          section('h3', null, 'Barangay Information'),
          section('div', { className: 'modal-body' },
            section('p', null, section('strong', null, 'Name: '), selectedUser.name),
            section('p', null, section('strong', null, 'Barangay: '), selectedUser.barangay),
            section('p', null, section('strong', null, 'Email: '), selectedUser.email),
          ),
          section(
            'div',
            { className: 'modal-actions' },
            section('button', { className: 'btn-close', onClick: handleCloseModal }, 'Close'),
          ),
        ),
        actionType === 'changeBarangay' && section(
          React.Fragment,
          null,
          section('h3', null, 'Change Barangay'),
          section('div', { className: 'modal-body' },
            section('p', null, 'Select the correct barangay:'),
            section(
              'select',
              {
                value: newBarangay,
                onChange: (e) => setNewBarangay(e.target.value),
                className: 'modal-input',
              },
              section('option', { value: '' }, 'Select barangay'),
              BARANGAYS.map((b) => section('option', { key: b, value: b }, b)),
            ),
          ),
          section(
            'div',
            { className: 'modal-actions' },
            section('button', { className: 'btn-cancel', onClick: handleCloseModal }, 'Cancel'),
            section('button', { className: 'btn-confirm', onClick: () => handleChangeBarangay(selectedUser.id) }, 'Save'),
          ),
        ),
        actionType === 'delete' && section(
          React.Fragment,
          null,
          section('h3', null, 'Delete Account?'),
          section('div', { className: 'modal-body' },
            section('p', null, `Are you sure you want to permanently delete ${selectedUser.name}'s account? This action cannot be undone.`),
          ),
          section(
            'div',
            { className: 'modal-actions' },
            section('button', { className: 'btn-cancel', onClick: handleCloseModal }, 'Cancel'),
            section('button', { className: 'btn-delete-confirm', onClick: () => handleDeleteUser(selectedUser.id) }, 'Delete'),
          ),
        ),
      ),
    ),
    activationUser && section(
      'div',
      { className: 'modal-overlay', onClick: () => setActivationUser(null) },
      section(
        'div',
        { className: 'modal-content', onClick: (event) => event.stopPropagation() },
        section('h3', null, 'Activate Resident'),
        section('div', { className: 'modal-body' },
          section('p', null, `Activate ${activationUser.name} and check them into an evacuation center.`),
          section('select', { className: 'modal-input', value: activationCenterId, onChange: (event) => setActivationCenterId(event.target.value), disabled: isActivating },
            section('option', { value: '' }, 'Select evacuation center'),
            ...centers.filter((center) => center.barangay === activationUser.barangay && Number(center.availableSlots) > 0)
              .map((center) => section('option', { key: center.id, value: center.id }, `${center.name} (${center.availableSlots} slots)`)),
          ),
        ),
        section('div', { className: 'modal-actions' },
          section('button', { className: 'btn-cancel', onClick: () => setActivationUser(null), disabled: isActivating }, 'Cancel'),
          section('button', { className: 'btn-confirm', onClick: handleActivateAtCenter, disabled: !activationCenterId || isActivating }, isActivating ? 'Activating...' : 'Activate'),
        ),
      ),
    ),
    // Modal for creating staff
    showCreateStaff && section(
      'div',
      { className: 'modal-overlay', onClick: handleCloseCreateStaff },
      section(
        'div',
        { className: 'modal-content modal-create-staff', onClick: (e) => e.stopPropagation() },
        section('h3', null, 'Create Staff Account'),
        section('div', { className: 'modal-body' },
          section(
            'div',
            { className: 'form-group' },
            section('label', null, 'Full Name *'),
            section('input', {
              type: 'text',
              value: staffForm.name,
              onChange: (e) => setStaffForm({ ...staffForm, name: e.target.value }),
              placeholder: 'Enter staff name',
              className: 'modal-input',
            }),
          ),
          section(
            'div',
            { className: 'form-group' },
            section('label', null, 'Email *'),
            section('input', {
              type: 'email',
              value: staffForm.email,
              onChange: (e) => setStaffForm({ ...staffForm, email: e.target.value }),
              placeholder: 'Enter email',
              className: 'modal-input',
            }),
          ),
          section(
            'div',
            { className: 'form-group' },
            section('label', null, 'Password *'),
            section('input', {
              type: 'password',
              value: staffForm.password,
              onChange: (e) => setStaffForm({ ...staffForm, password: e.target.value }),
              placeholder: 'Enter password (min 6 characters)',
              className: 'modal-input',
            }),
            section('small', { className: 'password-hint' }, 'Password must be at least 6 characters long'),
          ),
          section(
            'div',
            { className: 'form-group' },
            section('label', null, 'Barangay *'),
            section(
              'select',
              {
                value: staffForm.barangay,
                onChange: (e) => setStaffForm({ ...staffForm, barangay: e.target.value }),
                className: 'modal-input',
              },
              section('option', { value: '' }, 'Select barangay'),
              BARANGAYS.map((b) => section('option', { key: b, value: b }, b)),
            ),
          ),
        ),
        section(
          'div',
          { className: 'modal-actions' },
          section('button', { className: 'btn-cancel', onClick: handleCloseCreateStaff }, 'Cancel'),
          section('button', { className: 'btn-create', onClick: handleCreateStaff }, 'Create Staff'),
        ),
      ),
    ),
  )
}

export default UserManagementPage
