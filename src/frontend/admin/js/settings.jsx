import React from 'react'
import { Bell, Globe2, Moon, Sun } from 'lucide-react'
import '../css/setting.css'

const SETTINGS_KEY = 'evacready-settings'

function loadSettings() {
  try {
    return { darkMode: false, language: 'en', notifications: true, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return { darkMode: false, language: 'en', notifications: true }
  }
}

function SettingsPage() {
  const [settings, setSettings] = React.useState(loadSettings)

  React.useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    document.documentElement.classList.toggle('evacready-dark-mode', settings.darkMode)
    window.dispatchEvent(new CustomEvent('evacready-settings-changed', { detail: settings }))
  }, [settings])

  const updateSetting = (key, value) => setSettings((currentSettings) => ({ ...currentSettings, [key]: value }))

  return (
    <section className="settings-page">
      <header className="settings-page__header">
        <p>Preferences</p>
        <h1>Settings</h1>
      </header>
      <section className="settings-panel">
        <div className="settings-row">
          <div className="settings-row__icon"><Moon aria-hidden="true" size={21} /></div>
          <div className="settings-row__content"><h2>Dark mode</h2><p>Use a darker interface for low-light environments.</p></div>
          <button className={`settings-switch${settings.darkMode ? ' is-enabled' : ''}`} type="button" role="switch" aria-checked={settings.darkMode} onClick={() => updateSetting('darkMode', !settings.darkMode)}><span className="settings-switch__thumb">{settings.darkMode ? <Moon size={13} /> : <Sun size={13} />}</span></button>
        </div>
        <div className="settings-row">
          <div className="settings-row__icon"><Globe2 aria-hidden="true" size={21} /></div>
          <div className="settings-row__content"><h2>Language</h2><p>Choose the language used for new settings screens.</p></div>
          <select className="settings-select" value={settings.language} onChange={(event) => updateSetting('language', event.target.value)} aria-label="Select language"><option value="en">English</option><option value="fil">Filipino</option></select>
        </div>
        <div className="settings-row">
          <div className="settings-row__icon"><Bell aria-hidden="true" size={21} /></div>
          <div className="settings-row__content"><h2>Alert notifications</h2><p>Show unread alert indicators in the resident dashboard.</p></div>
          <button className={`settings-switch${settings.notifications ? ' is-enabled' : ''}`} type="button" role="switch" aria-checked={settings.notifications} onClick={() => updateSetting('notifications', !settings.notifications)}><span className="settings-switch__thumb" /></button>
        </div>
      </section>
    </section>
  )
}

export default SettingsPage