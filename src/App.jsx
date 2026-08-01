import './App.css'
import { useState } from 'react'
import Sidebar from './frontend/admin/js/sidebar.js'
import Home from './frontend/admin/js/home.js'
import AlertPage from './frontend/admin/js/alert.js'
import EvacManagePage from './frontend/admin/js/evacmanage.js'
import EvacuationCenterPage from './frontend/admin/js/evacuationcenter.js'
import ReportPage from './frontend/admin/js/report.js'
import SettingsPage from './frontend/admin/js/settings.js'
import UserManagementPage from './frontend/admin/js/usermanagement.js'

function App() {
  const [page, setPage] = useState('dashboard')

  const renderPage = () => {
    switch (page) {
      case 'alert':
        return <AlertPage />
      case 'evacmanage':
        return <EvacManagePage />
      case 'evacuationcenter':
        return <EvacuationCenterPage />
      case 'report':
        return <ReportPage />
      case 'settings':
        return <SettingsPage />
      case 'usermanagement':
        return <UserManagementPage />
      default:
        return <Home navigate={setPage} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar current={page} navigate={setPage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}

export default App
