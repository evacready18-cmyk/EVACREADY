import './App.css'
import { useState, useEffect } from 'react'
import Sidebar from './frontend/admin/js/sidebar.js'
import LoginHomepage from './frontend/login.jsx'
import RegisterForm from './frontend/register.jsx'
import Home from './frontend/admin/js/home.js'
import AlertPage from './frontend/admin/js/alert.js'
import EvacManagePage from './frontend/admin/js/evacmanage.jsx'
import EvacuationCenterPage from './frontend/admin/js/evacuationcenter.jsx'
import ReportPage from './frontend/admin/js/report.jsx'
import SettingsPage from './frontend/admin/js/settings.jsx'
import UserManagementPage from './frontend/admin/js/usermanagement.js'
import { registerWithEmailPassword, signInWithEmailPassword, signOutUser, onAuthStateChanged, signInWithGoogle, getUserProfile, setCurrentStaffStatus, subscribeToUserProfile } from './services/firebase.js'
import StaffSidebar from './frontend/staff/js/sidebar.jsx'
import StaffSection from './frontend/staff/js/section.jsx'
import UserSidebar from './frontend/user/js/sidebar.jsx'
import UserSection from './frontend/user/js/section.jsx'

function App() {
  const [page, setPage] = useState('login')
  const [isInitializing, setIsInitializing] = useState(true)
  const [staffBarangay, setStaffBarangay] = useState('')
  const [currentUid, setCurrentUid] = useState('')

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(window.localStorage.getItem('evacready-settings') || '{}')
      document.documentElement.classList.toggle('evacready-dark-mode', Boolean(savedSettings.darkMode))
    } catch {
      document.documentElement.classList.remove('evacready-dark-mode')
    }
  }, [])

  // Keeps staffBarangay in sync with Firestore in real time, so an admin correcting
  // a staff member's barangay takes effect immediately without a re-login.
  useEffect(() => {
    if (!currentUid) return undefined
    const unsubscribe = subscribeToUserProfile(currentUid, (profile) => {
      if (profile && profile.role === 'staff') {
        setStaffBarangay(profile.barangay || '')
      }
    })
    return unsubscribe
  }, [currentUid])

  // Resolves role/barangay from the Firestore profile (authoritative, cross-device),
  // falling back to the localStorage values used for legacy/manually-created accounts.
  // Profile creation remains in the sign-in providers, avoiding a competing write
  // while an email registration is still saving its complete resident profile.
  const resolveRoleAndBarangay = async (uid, email) => {
    const emailKey = `evacready-role:${email.trim().toLowerCase()}`
    let role = window.localStorage.getItem(emailKey) || 'user'
    let barangay = window.localStorage.getItem(`${emailKey}-barangay`) || ''
    try {
      const profile = await getUserProfile(uid)
      if (profile) {
        role = profile.role || role
        barangay = profile.barangay || barangay
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
    return { role, barangay }
  }

  useEffect(() => {
    // Check if user is already logged in on app mount
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        // User is logged in, restore their session
        setCurrentUid(user.uid)
        resolveRoleAndBarangay(user.uid, user.email).then(({ role, barangay }) => {
          if (role === 'staff') setStaffBarangay(barangay)
          setPage(role === 'staff' ? 'staff-evacuees' : role === 'user' ? 'user-information' : `${role}-dashboard`)
          setIsInitializing(false)
        })
      } else {
        // User is not logged in
        setCurrentUid('')
        setPage('login')
        setIsInitializing(false)
      }
    })
    return unsubscribe
  }, [])

  const handleLogin = async ({ email, password }) => {
    try {
      const user = await signInWithEmailPassword(email, password)
      setCurrentUid(user.uid)
      const { role, barangay } = await resolveRoleAndBarangay(user.uid, email)
      if (role === 'staff') setStaffBarangay(barangay)
      setPage(role === 'staff' ? 'staff-evacuees' : role === 'user' ? 'user-information' : `${role}-dashboard`)
    } catch (error) {
      alert(error.message)
    }
  }

  const handleRegister = async (payload) => {
    const emailKey = `evacready-role:${payload.email.trim().toLowerCase()}`
    window.localStorage.setItem(emailKey, payload.role)
    try {
      const user = await registerWithEmailPassword(payload)
      setCurrentUid(user.uid)
      if (payload.role === 'staff') {
        setStaffBarangay(payload.barangay)
        setPage('staff-evacuees')
      } else if (payload.role === 'admin') {
        setPage('admin-dashboard')
      } else {
        setPage('user-information')
      }
      return true
    } catch (error) {
      alert(error.message)
      return false
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle()
      const email = user.email.trim().toLowerCase()
      setCurrentUid(user.uid)
      const { role, barangay } = await resolveRoleAndBarangay(user.uid, email)
      if (role === 'staff') setStaffBarangay(barangay)
      setPage(role === 'staff' ? 'staff-evacuees' : role === 'user' ? 'user-information' : `${role}-dashboard`)
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing
      } else if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection.')
      } else {
        alert(error.message)
      }
    }
  }

  const handleLogout = async () => {
    try {
      if (page.startsWith('staff-')) await setCurrentStaffStatus('Inactive')
      await signOutUser()
      setPage('login')
    } catch (error) {
      alert(error.message)
    }
  }

  const renderPage = () => {
    if (page === 'login') {
      return <LoginHomepage onContinue={handleLogin} onCreateAccount={() => setPage('register')} onGoogleAccount={handleGoogleLogin} />
    }
    if (page === 'register') {
      return <RegisterForm onSubmit={handleRegister} onBack={() => setPage('login')} onGoogleAccount={handleGoogleLogin} />
    }
    if (page === 'admin-dashboard' || page === 'home' || page === 'dashboard') return <Home navigate={setPage} onLogout={handleLogout} />
    if (page === 'usermanagement') return <UserManagementPage allowedRole="Staff" />
    if (page.startsWith('user-')) return <UserSection page={page} currentUid={currentUid} />
    if (page === 'staff-evacuees') return <EvacManagePage barangay={staffBarangay} />
    if (page === 'staff-usermanagement') return <UserManagementPage allowedRole="User" barangay={staffBarangay} />
    if (page === 'staff-alert') return <AlertPage audienceFilter={['staff', 'evacuees', 'all']} />
    if (page === 'staff-evacuation-center') return <EvacuationCenterPage />
    if (page === 'staff-report') return <ReportPage barangay={staffBarangay} />
    if (page === 'staff-settings') return <SettingsPage />
    if (page.startsWith('staff-')) return <StaffSection page={page} />
    if (page === 'alert') return <AlertPage />
    if (page === 'evacmanage') return <EvacManagePage />
    if (page === 'evacuationcenter') return <EvacuationCenterPage />
    if (page === 'report') return <ReportPage />
    if (page === 'settings') return <SettingsPage />
    return <div>Page not found</div>
  }

  // Show loading indicator while checking authentication state
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #4f46e5 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#ffffff'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Loading...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (page === 'login' || page === 'register') {
    return renderPage()
  }

  const isStaff = page.startsWith('staff-')
  const isUser = page.startsWith('user-')

  return (
    <div className={`app-shell${isStaff ? ' staff-shell' : ''}${isUser ? ' user-shell' : ''}`}>
      {isStaff ? (
        <StaffSidebar current={page} navigate={setPage} onLogout={handleLogout} />
      ) : isUser ? (
        <UserSidebar current={page} currentUid={currentUid} navigate={setPage} onLogout={handleLogout} />
      ) : (
        <Sidebar current={page} navigate={setPage} onLogout={handleLogout} />
      )}
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}

export default App
