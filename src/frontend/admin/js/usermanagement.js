import React from 'react'
import '../css/usermanagement.css'
import { USER_ACCOUNTS } from '../../data/userAccounts.js'
import { registerWithEmailPassword } from '../../../services/firebase.js'

const section = React.createElement

function UserManagementPage() {
  const [users, setUsers] = React.useState(USER_ACCOUNTS)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('All')
  const [statusFilter, setStatusFilter] = React.useState('All')
  const [selectedUser, setSelectedUser] = React.useState(null)
  const [actionType, setActionType] = React.useState(null)
  const [newName, setNewName] = React.useState('')
  const [showCreateStaff, setShowCreateStaff] = React.useState(false)
  const [staffForm, setStaffForm] = React.useState({
    name: '',
    email: '',
    password: '',
    barangay: '',
  })

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
    
    // Role filter
    if (roleFilter !== 'All') {
      result = result.filter(user => user.role === roleFilter)
    }
    
    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter(user => user.status === statusFilter)
    }
    
    return result
  }, [users, searchQuery, roleFilter, statusFilter])

  const handleAction = (user, action) => {
    setSelectedUser(user)
    setActionType(action)
    setNewName(user.name)
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setActionType(null)
    setNewName('')
  }

  const handleVerifyUser = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, verified: true }
        : user
    ))
    handleCloseModal()
  }

  const handleChangeName = (userId) => {
    if (!newName.trim()) {
      alert('Please enter a name')
      return
    }
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, name: newName }
        : user
    ))
    handleCloseModal()
  }

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId))
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
      // Register staff in Firebase
      const firebaseUser = await registerWithEmailPassword({
        email: staffForm.email,
        password: staffForm.password,
        name: staffForm.name,
      })

      // Store staff role and barangay in localStorage
      const emailKey = `evacready-role:${staffForm.email.trim().toLowerCase()}`
      window.localStorage.setItem(emailKey, 'staff')
      window.localStorage.setItem(`${emailKey}-barangay`, staffForm.barangay)

      const newStaff = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        role: 'Staff',
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        barangay: staffForm.barangay,
        verified: true,
      }

      setUsers([...users, newStaff])
      setShowCreateStaff(false)
      setStaffForm({ name: '', email: '', password: '', barangay: '' })
      alert(`Staff account created successfully!\n\nEmail: ${newStaff.email}\nPassword: ${newStaff.password}\n\nThe account is now available in Firebase and can be used to log in to the system.`)
    } catch (error) {
      console.error('Error creating staff account:', error)
      alert(`Error creating staff account: ${error.message}`)
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
        section('p', null, 'Manage user roles, access, and accounts'),
      ),
      section('button', {
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
            value: roleFilter,
            onChange: (e) => setRoleFilter(e.target.value),
          },
          section('option', null, 'All Roles'),
          section('option', null, 'Admin'),
          section('option', null, 'Staff'),
          section('option', null, 'User'),
        ),
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
            section('td', { colSpan: 6, className: 'no-data' }, 'No users found')
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
            section('input', {
              type: 'text',
              value: staffForm.barangay,
              onChange: (e) => setStaffForm({ ...staffForm, barangay: e.target.value }),
              placeholder: 'Enter barangay',
              className: 'modal-input',
            }),
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
