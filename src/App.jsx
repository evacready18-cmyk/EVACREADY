import './App.css'
import { useState } from 'react'
import Sidebar from './frontend/admin/js/sidebar.js'
import LoginHomepage from './frontend/login.jsx'
import Home from './frontend/admin/js/home.js'
import AlertPage from './frontend/admin/js/alert.js'
import EvacManagePage from './frontend/admin/js/evacmanage.js'
import EvacuationCenterPage from './frontend/admin/js/evacuationcenter.js'

function App() {
  const [page, setPage] = useState('login')

  const renderPage = () => {
    if (page === 'login') return <LoginHomepage onContinue={() => setPage('home')} />
    if (page === 'home' || page === 'dashboard') return <Home />
    if (page === 'alert') return <AlertPage />
    if (page === 'evacmanage') return <EvacManagePage />
    if (page === 'evacuationcenter') return <EvacuationCenterPage />
    return <div>Page not found</div>
  }

  if (page === 'login') {
    return renderPage()
  }

  return (
    <div className="app-shell">
      <Sidebar current={page} navigate={setPage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}

export default App
