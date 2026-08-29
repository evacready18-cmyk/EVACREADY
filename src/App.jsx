import './App.css'
import { useState, useEffect } from 'react'
import Sidebar from './frontend/admin/js/sidebar.js'
import LoginHomepage from './frontend/login.jsx'
import RegisterForm from './frontend/register.jsx'
import Home from './frontend/admin/js/home.js'
import AlertPage from './frontend/admin/js/alert.js'
import EvacManagePage from './frontend/admin/js/evacmanage.js'
import EvacuationCenterPage from './frontend/admin/js/evacuationcenter.js'
import ReportPage from './frontend/admin/js/report.js'
import SettingsPage from './frontend/admin/js/settings.js'
import UserManagementPage from './frontend/admin/js/usermanagement.js'
import { registerWithEmailPassword, signInWithEmailPassword, signOutUser, onAuthStateChanged, signInWithGoogle } from './services/firebase.js'
import StaffSidebar from './frontend/staff/js/sidebar.jsx'
import StaffSection from './frontend/staff/js/section.jsx'
import UserSidebar from './frontend/user/js/sidebar.jsx'
import UserSection from './frontend/user/js/section.jsx'

function App() {
  const [page, setPage] = useState('login')
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Check if user is already logged in on app mount
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        // User is logged in, restore their session
        const role = window.localStorage.getItem(`evacready-role:${user.email.trim().toLowerCase()}`) || 'admin'
        setPage(role === 'staff' ? 'staff-evacuees' : role === 'user' ? 'user-information' : `${role}-dashboard`)
      } else {
        // User is not logged in
        setPage('login')
      }
      setIsInitializing(false)
    })
    return unsubscribe
  }, [])

  const handleLogin = async ({ email, password }) => {
    try {
      await signInWithEmailPassword(email, password)
      const role = window.localStorage.getItem(`evacready-role:${email.trim().toLowerCase()}`) || 'admin'
      setPage(role === 'staff' ? 'staff-evacuees' : role === 'user' ? 'user-information' : `${role}-dashboard`)
    } catch (error) {
      alert(error.message)
    }
  }

  const handleRegister = async (payload) => {
    try {
      await registerWithEmailPassword(payload)
      window.localStorage.setItem(`evacready-role:${payload.email.trim().toLowerCase()}`, payload.role)
      setPage(payload.role === 'staff' ? 'staff-evacuees' : payload.role === 'user' ? 'user-information' : `${payload.role}-dashboard`)
    } catch (error) {
      alert(error.message)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle()
      const email = user.email.trim().toLowerCase()
      // Check if user has a role stored, default to 'user' for Google login
      const role = window.localStorage.getItem(`evacready-role:${email}`) || 'user'
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
    if (page === 'usermanagement') return <UserManagementPage />
    if (page.startsWith('user-')) return <UserSection page={page} />
    if (page === 'staff-evacuees') return <EvacManagePage />
    if (page === 'staff-alert') return <AlertPage />
    if (page === 'staff-evacuation-center') return <EvacuationCenterPage />
    if (page === 'staff-report') return <ReportPage />
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
        <UserSidebar current={page} navigate={setPage} onLogout={handleLogout} />
      ) : (
        <Sidebar current={page} navigate={setPage} onLogout={handleLogout} />
      )}
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}

export default App
