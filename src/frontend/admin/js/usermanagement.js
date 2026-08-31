import React from 'react'
import '../css/usermanagement.css'
import { BARANGAYS } from '../../data/barangays.js'
import { createStaffAccount, subscribeToUsers, updateUserProfileFields, deleteUserProfile } from '../../../services/firebase.js'

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
    role: raw.role ? raw.role.charAt(0).toUpperCase() + raw.role.slice(1) : 'User',
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
        section('h2', null, 'User Management'),
        section('p', null, allowedRole === 'Staff' ? 'Manage staff roles, access, and accounts' : 'Manage user roles, access, and accounts'),
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
        section('span', { className: 'search-icon' }, '🔍'),
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
            section('td', { colSpan: 6, className: 'no-data' }, allowedRole === 'Staff' ? 'No staff found' : `No users found${barangay ? ` in ${barangay}` : ''}`)
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
